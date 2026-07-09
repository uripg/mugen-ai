import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/session";
import { regenerateDraft } from "@/lib/pipeline/regenerate";

// POST /api/leads/[id]/regenerate — regenerates the draft for a lead.
// Paid Anthropic call, but ONLY inside this explicit human-triggered request
// (AGENTS.md invariant 10) — never scheduled, never automatic.

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const { env } = await getCloudflareContext({ async: true });

	try {
		const result = await regenerateDraft(env, { leadId: id });
		return Response.json(result);
	} catch (err) {
		if (err instanceof Error && /unknown lead/i.test(err.message)) {
			return Response.json({ error: "lead not found" }, { status: 404 });
		}
		return Response.json({ error: "regenerate failed" }, { status: 500 });
	}
}
