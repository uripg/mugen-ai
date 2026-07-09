import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/session";
import { runPipeline } from "@/lib/pipeline/run";

// POST /api/pipeline/run — kicks off one full pipeline run for an account.
// Paid calls (Anthropic, FullEnrich, Sillage) happen ONLY inside this
// human-triggered request — never scheduled (AGENTS.md invariant 10).
// No send/approve logic here (invariant 1).

const bodySchema = z.object({ accountId: z.string().min(1) });

export async function POST(req: Request) {
	// Server-side session check FIRST (invariant 7). API route → 401, not redirect.
	const session = await getSession();
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	// Validate the boundary with zod (invariant 8).
	let json: unknown;
	try {
		json = await req.json();
	} catch {
		return Response.json({ error: "invalid JSON body" }, { status: 400 });
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return Response.json(
			{ error: "accountId (non-empty string) is required" },
			{ status: 400 },
		);
	}

	const { env } = await getCloudflareContext({ async: true });

	// The run takes minutes of upstream I/O; with no response bytes the
	// Cloudflare edge idle-times-out the connection and cancels the Worker
	// mid-run (live-observed: run orphaned at "enriching"). So the result is
	// streamed as NDJSON: heartbeat lines while the run executes, the
	// RunPipelineResult (or {error}) as the final line. A status "failed" run
	// is still a normal final line — the failure is recorded state on
	// pipeline_runs and the dashboard reads it.
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const heartbeat = setInterval(() => {
				controller.enqueue(encoder.encode('{"heartbeat":true}\n'));
			}, 15_000);
			try {
				const result = await runPipeline(env, {
					accountId: parsed.data.accountId,
				});
				controller.enqueue(encoder.encode(`${JSON.stringify(result)}\n`));
			} catch (err) {
				// runPipeline throws only for caller bugs (unknown accountId).
				const notFound =
					err instanceof Error &&
					/unknown (target )?account/i.test(err.message);
				controller.enqueue(
					encoder.encode(
						`${JSON.stringify({ error: notFound ? "account not found" : "pipeline error" })}\n`,
					),
				);
			} finally {
				clearInterval(heartbeat);
				controller.close();
			}
		},
	});
	return new Response(stream, {
		headers: { "content-type": "application/x-ndjson" },
	});
}
