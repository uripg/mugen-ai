import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/session";
import { leads } from "@/lib/db/app.schema";

// POST /api/leads/[id]/approve — the ONLY path to "sent-simulated" (invariant 1):
// a server-enforced state machine behind auth; no auto-send code path exists.
// Allowed: draft|edited → approved, approved → sent-simulated. Anything else → 409.

const bodySchema = z.object({ to: z.enum(["approved", "sent-simulated"]) });

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	let json: unknown;
	try {
		json = await req.json();
	} catch {
		return Response.json({ error: "invalid JSON body" }, { status: 400 });
	}
	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return Response.json(
			{ error: 'to must be "approved" or "sent-simulated"' },
			{ status: 400 },
		);
	}

	const { id } = await params;
	const { env } = await getCloudflareContext({ async: true });
	const db = drizzle(env.DB);

	const [lead] = await db
		.select({ id: leads.id, status: leads.status })
		.from(leads)
		.where(eq(leads.id, id))
		.limit(1);
	if (!lead) {
		return Response.json({ error: "lead not found" }, { status: 404 });
	}

	const { to } = parsed.data;
	const allowed =
		(to === "approved" && (lead.status === "draft" || lead.status === "edited")) ||
		(to === "sent-simulated" && lead.status === "approved");
	if (!allowed) {
		return Response.json(
			{ error: `cannot transition from "${lead.status}" to "${to}"` },
			{ status: 409 },
		);
	}

	await db.update(leads).set({ status: to }).where(eq(leads.id, id));
	return Response.json({ status: to });
}
