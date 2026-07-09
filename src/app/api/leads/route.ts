import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth/session";
import {
	targetAccounts,
	signals,
	contacts,
	leads,
	dealIntel,
	drafts,
	pipelineRuns,
} from "@/lib/db/app.schema";

// GET /api/leads — the single payload the dashboard polls (~3s). Everything the
// UI renders comes from D1 through here, so a hard refresh loses nothing.
// PII note: this is the authed product surface — names/emails render here by
// design (invariant 9: never log them; nothing is logged in this route).

export async function GET() {
	// Server-side session check FIRST (invariant 7). API route → 401 JSON.
	const session = await getSession();
	if (!session) {
		return Response.json({ error: "unauthorized" }, { status: 401 });
	}

	const { env } = await getCloudflareContext({ async: true });
	const db = drizzle(env.DB);

	// Demo-scale dataset: fetch each table once and assemble in memory.
	const [accountRows, signalRows, contactRows, leadRows, intelRows, draftRows, runRows] =
		await Promise.all([
			db.select().from(targetAccounts),
			db.select().from(signals),
			db.select().from(contacts),
			db.select().from(leads),
			db.select().from(dealIntel),
			db.select().from(drafts).orderBy(desc(drafts.version), desc(drafts.createdAt)),
			db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)),
		]);

	const signalById = new Map(signalRows.map((s) => [s.id, s]));
	const contactById = new Map(contactRows.map((c) => [c.id, c]));

	const accounts = accountRows.map((account) => {
		const committee = contactRows
			.filter((c) => c.accountId === account.id && c.committeeRole !== null)
			.map((c) => ({
				id: c.id,
				name: c.name,
				title: c.title,
				verified: c.verified,
				committeeRole: c.committeeRole,
			}));

		const accountLeads = leadRows
			.filter((l) => l.accountId === account.id)
			.map((lead) => {
				const signal = signalById.get(lead.signalId);
				const primary = lead.primaryContactId
					? contactById.get(lead.primaryContactId)
					: undefined;
				return {
					id: lead.id,
					stage: lead.stage,
					status: lead.status,
					score: lead.score,
					scoreReasoning: lead.scoreReasoning,
					stageDetail: lead.stageDetail,
					signal: signal
						? {
								type: signal.type,
								summary: signal.summary,
								detectedAt: signal.detectedAt,
							}
						: null,
					primaryContact: primary
						? {
								name: primary.name,
								title: primary.title,
								verified: primary.verified,
								committeeRole: primary.committeeRole,
							}
						: null,
					committee,
					dealIntel: dealIntelForLead(intelRows, lead.id),
					drafts: draftRows
						.filter((d) => d.leadId === lead.id)
						.map((d) => ({
							id: d.id,
							version: d.version,
							body: d.body,
							editedBody: d.editedBody,
							createdAt: d.createdAt,
						})),
				};
			});

		return {
			id: account.id,
			name: account.name,
			market: account.market,
			domain: account.domain,
			runs: runRows
				.filter((r) => r.accountId === account.id)
				.map((r) => ({
					id: r.id,
					stage: r.stage,
					status: r.status,
					error: r.error,
					startedAt: r.startedAt,
				})),
			leads: accountLeads,
		};
	});

	return Response.json({ accounts });
}

function dealIntelForLead(
	rows: (typeof dealIntel.$inferSelect)[],
	leadId: string,
) {
	return rows
		.filter((r) => r.leadId === leadId)
		.map((r) => {
			// competitor-note: surface citations from rawPayload when trivially
			// present (invariant 2 provenance); otherwise skip.
			let citations: string[] | undefined;
			if (r.kind === "competitor-note" && r.rawPayload) {
				const raw = r.rawPayload as { citations?: unknown };
				if (
					Array.isArray(raw.citations) &&
					raw.citations.every((c) => typeof c === "string")
				) {
					citations = raw.citations as string[];
				}
			}
			return {
				id: r.id,
				kind: r.kind,
				content: r.content,
				playbookKey: r.playbookKey,
				createdAt: r.createdAt,
				...(citations ? { citations } : {}),
			};
		});
}
