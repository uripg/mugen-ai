import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/session";
import { drafts, leads } from "@/lib/db/app.schema";

// POST /api/leads/[id]/edit — human edit of the latest draft version. Sets
// editedBody on that draft and lead status "edited". A sent-simulated lead is
// immutable (409) — invariant 1's state machine stays server-enforced.

const bodySchema = z.object({ body: z.string().min(1).max(20000) });

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
			{ error: "body (1–20000 chars) is required" },
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
	if (lead.status === "sent-simulated") {
		return Response.json(
			{ error: "cannot edit a sent-simulated lead" },
			{ status: 409 },
		);
	}

	const [latest] = await db
		.select({ id: drafts.id })
		.from(drafts)
		.where(eq(drafts.leadId, id))
		.orderBy(desc(drafts.version), desc(drafts.createdAt))
		.limit(1);
	if (!latest) {
		return Response.json({ error: "lead has no draft" }, { status: 409 });
	}

	await db
		.update(drafts)
		.set({ editedBody: parsed.data.body })
		.where(eq(drafts.id, latest.id));
	await db.update(leads).set({ status: "edited" }).where(eq(leads.id, id));

	return Response.json({ draftId: latest.id });
}
