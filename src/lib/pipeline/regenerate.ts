// regenerateDraft (T-009 backend): one bounded, human-triggered model call
// that writes a new version of a lead's outreach draft from the SAME persisted
// inputs (value prop, competitor note, signal, contact) — no tools, no
// retries (invariant 10). Called from an auth-gated route. A regenerated
// draft resets lead status to "draft" — it needs fresh approval (invariant 1).

import Anthropic from "@anthropic-ai/sdk";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
	contacts,
	dealIntel,
	drafts,
	leads,
	signals,
	targetAccounts,
} from "../db/app.schema";
import { playbooks, type MarketPlaybook } from "../playbooks";
import { PRODUCT_CONTEXT } from "./product";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 2000;

export async function regenerateDraft(
	env: Pick<CloudflareEnv, "DB" | "CLAUDE_API_KEY">,
	input: { leadId: string },
): Promise<{ draftId: string; version: number }> {
	const db = drizzle(env.DB);

	const [lead] = await db
		.select()
		.from(leads)
		.where(eq(leads.id, input.leadId));
	if (!lead) {
		throw new Error(`Unknown lead: ${input.leadId}`);
	}
	const [account] = await db
		.select()
		.from(targetAccounts)
		.where(eq(targetAccounts.id, lead.accountId));
	if (!account) {
		throw new Error(`Lead ${input.leadId} has unknown account`);
	}
	const playbook: MarketPlaybook | undefined = playbooks[account.market];
	if (!playbook) {
		throw new Error(
			`Account ${account.id} has out-of-scope market "${account.market}" — Phase 1 is JP/KR/SG only`,
		);
	}
	const [signal] = await db
		.select()
		.from(signals)
		.where(eq(signals.id, lead.signalId));
	const [contact] = lead.primaryContactId
		? await db
				.select()
				.from(contacts)
				.where(eq(contacts.id, lead.primaryContactId))
		: [];
	const intelRows = await db
		.select()
		.from(dealIntel)
		.where(eq(dealIntel.leadId, lead.id))
		.orderBy(desc(dealIntel.createdAt));
	const [latest] = await db
		.select()
		.from(drafts)
		.where(eq(drafts.leadId, lead.id))
		.orderBy(desc(drafts.version))
		.limit(1);
	if (!latest) {
		throw new Error(`Lead ${input.leadId} has no draft to regenerate`);
	}

	// Latest-first rows: first match per kind is the newest.
	const valueProp = intelRows.find(
		(row) => row.kind === "repositioned-value-prop",
	);
	const competitor = intelRows.find((row) => row.kind === "competitor-note");

	const bullets = (lines: string[]) =>
		lines.map((line) => `- ${line}`).join("\n");
	const system = `You are an SDR writing one outreach email draft for the vendor below. Output ONLY the email (a "Subject: ..." line then the body) — no preamble.

Our product: ${PRODUCT_CONTEXT}

Target account: ${account.name}${account.domain ? ` (${account.domain})` : ""} — market: ${playbook.marketName}.

Draft rules:
- Tone, structure and judgment must follow ONLY the team-authored messaging judgment below. Never invent cultural claims, named customers, proof points, ROI numbers, or compliance/local-presence claims not supported by the persisted inputs below.
- Draft in English, concise (about 120-180 words), reference the specific selected signal, and end with a clear next step.
- The draft MUST be written from the saved value prop (not a generic European pitch).

Messaging judgment — ${playbook.marketName}:
${bullets(playbook.messagingJudgment)}

Persisted inputs (the ONLY grounding you may use):
- Selected signal: ${signal ? `[${signal.type}] ${signal.summary}` : "(none persisted)"}
- Verified contact title: ${contact?.title ?? "(unknown)"}
- Saved value prop: ${valueProp?.content ?? "(none persisted)"}
- Competitor note: ${competitor?.content ?? "(none persisted)"}`;

	// One bounded call, no tools, no retries (invariant 10).
	const anthropic = new Anthropic({ apiKey: env.CLAUDE_API_KEY });
	const response = await anthropic.messages.create({
		model: MODEL,
		max_tokens: MAX_TOKENS,
		system,
		messages: [
			{
				role: "user",
				content: `Write a new, improved version of this outreach draft. Previous version:\n${latest.editedBody ?? latest.body}`,
			},
		],
	});
	const text = response.content
		.filter((block): block is Anthropic.TextBlock => block.type === "text")
		.map((block) => block.text)
		.join("")
		.trim();
	if (!text) {
		throw new Error(
			`regenerate produced no text (stop_reason=${response.stop_reason})`,
		);
	}

	const version = latest.version + 1;
	const [draft] = await db
		.insert(drafts)
		.values({
			leadId: lead.id,
			version,
			// Model is prompted to include its own "Subject:" line; stored raw.
			body: text,
			editedBody: null,
			sourceTool: "pipeline_regenerate",
			// Provenance (invariant 2).
			rawPayload: {
				model: MODEL,
				leadId: lead.id,
				signalId: lead.signalId,
				contactId: lead.primaryContactId,
				basedOnVersion: latest.version,
				usage: response.usage,
			},
		})
		.returning();
	// Invariant 1: a regenerated draft needs fresh approval.
	await db
		.update(leads)
		.set({ status: "draft" })
		.where(eq(leads.id, lead.id));

	return { draftId: draft.id, version };
}
