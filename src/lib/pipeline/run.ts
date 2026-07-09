// Pipeline runner (T-007): the headless Claude tool-use loop behind
// POST /api/pipeline/run. One explicit human-triggered run per call
// (invariant 10) under hard bounds: 16 model turns, 8 web searches, 2 paid
// enrichment attempts. Claude drives get_signals / web_search /
// select_signal / enrich_contact / write_draft; every stage transition is
// written to `pipeline_runs.stage` so the dashboard can poll progress.
// Honest empties (unmapped account, no signals, no verified contact) are
// first-class "done" outcomes, never errors (invariants 2, 5). Model id and
// web_search tool type (web_search_20260209) verified against current
// Anthropic docs in T-006.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
	drafts,
	leads,
	pipelineRuns,
	signals,
	targetAccounts,
} from "../db/app.schema";
import { playbooks, type MarketPlaybook } from "../playbooks";
import { getSignals } from "../tools/get_signals";
import { enrichContact } from "../tools/enrich_contact";
import { PRODUCT_CONTEXT } from "./product";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 4000;
// Bounds (invariant 10): exceeding the turn bound is a run FAILURE, never a
// silent truncation. pause_turn resumes and invalid tool inputs both count.
const MAX_TURNS = 16;
const MAX_WEB_SEARCHES = 8;
const MAX_PAID_ENRICH_ATTEMPTS = 2;

// --- zod at the boundary (invariant 8): model tool inputs are external input

const getSignalsInputSchema = z.object({});

const selectSignalInputSchema = z.object({
	signal_id: z.string().min(1),
	reason: z.string().min(1),
});

const enrichContactInputSchema = z.object({
	first_name: z.string().min(1),
	last_name: z.string().min(1),
	linkedin_url: z.string().optional(),
});

const writeDraftInputSchema = z.object({
	subject: z.string().min(1),
	body: z.string().min(1),
});

// --- tool definitions ----------------------------------------------------------

// Server + client tools mix: web_search results arrive in-content; only the
// client tools below come back as stop_reason "tool_use".
const TOOLS: Anthropic.Messages.ToolUnion[] = [
	{
		type: "web_search_20260209",
		name: "web_search",
		max_uses: MAX_WEB_SEARCHES,
	},
	{
		name: "get_signals",
		description:
			"Fetch and persist the target account's expansion-readiness signals. Returns counts plus up to the 30 most recent persisted signals for the account.",
		input_schema: { type: "object", properties: {}, required: [] },
	},
	{
		name: "select_signal",
		description:
			"Select the ONE signal to pursue and create the lead. Provide the signal id (from get_signals) and your reasoning.",
		input_schema: {
			type: "object",
			properties: {
				signal_id: {
					type: "string",
					description: "Id of a signal returned by get_signals",
				},
				reason: {
					type: "string",
					description:
						"Why this signal best indicates international/Europe-expansion readiness",
				},
			},
			required: ["signal_id", "reason"],
		},
	},
	{
		name: "enrich_contact",
		description:
			"Verify a named person at the account via FullEnrich — the verification gate. Max 2 paid attempts per run.",
		input_schema: {
			type: "object",
			properties: {
				first_name: { type: "string" },
				last_name: { type: "string" },
				linkedin_url: {
					type: "string",
					description:
						"Optional LinkedIn profile URL; improves match rates",
				},
			},
			required: ["first_name", "last_name"],
		},
	},
	{
		name: "write_draft",
		description:
			"Store the outreach email draft for the verified contact. Only callable after enrich_contact returned a verified contact.",
		input_schema: {
			type: "object",
			properties: {
				subject: { type: "string" },
				body: { type: "string" },
			},
			required: ["subject", "body"],
		},
	},
];

// --- result contract (imported by the API route) --------------------------------

export interface RunPipelineResult {
	runId: string;
	leadId: string | null;
	draftId: string | null;
	/** Final stage recorded on pipeline_runs. */
	stage: string;
	status: "done" | "failed";
	outcome:
		| "drafted"
		| "no_verified_contact"
		| "no_signals"
		| "unmapped_account"
		| "error";
	/** One-line summary — ids only, never names/emails (invariant 9). */
	detail: string;
}

type PipelineEnv = Pick<
	CloudflareEnv,
	"DB" | "CLAUDE_API_KEY" | "SILLAGE_API_KEY" | "FULLENRICH_API_KEY"
>;

// --- run state ------------------------------------------------------------------

interface RunState {
	runId: string;
	leadId: string | null;
	selectedSignalId: string | null;
	contactId: string | null;
	draftId: string | null;
	paidEnrichAttempts: number;
	enrichFailures: number;
	lastUsage: Anthropic.Usage | null;
	/** Set by a tool handler when the run reached a first-class end state. */
	terminal: {
		outcome: Exclude<RunPipelineResult["outcome"], "error">;
		stage: string;
		detail: string;
	} | null;
}

interface RunContext {
	env: PipelineEnv;
	db: ReturnType<typeof drizzle>;
	account: typeof targetAccounts.$inferSelect;
	state: RunState;
}

interface ToolOutcome {
	value: unknown;
	isError: boolean;
}

const ok = (value: unknown): ToolOutcome => ({ value, isError: false });
const err = (message: string): ToolOutcome => ({
	value: { error: message },
	isError: true,
});
// Zod failure → is_error tool_result so Claude can self-correct (counts
// toward the turn bound like any other turn).
const invalidInput = (error: z.ZodError): ToolOutcome =>
	err(
		`Invalid tool input: ${error.issues
			.map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
			.join("; ")}`,
	);

async function setStage(ctx: RunContext, stage: string): Promise<void> {
	await ctx.db
		.update(pipelineRuns)
		.set({ stage })
		.where(eq(pipelineRuns.id, ctx.state.runId));
}

// --- system prompt ----------------------------------------------------------------

function buildSystemPrompt(
	account: typeof targetAccounts.$inferSelect,
	playbook: MarketPlaybook,
): string {
	const bullets = (lines: string[]) =>
		lines.map((line) => `- ${line}`).join("\n");
	return `You are an SDR pipeline agent for the vendor described below. You run headless inside a pipeline: complete the task with your tools, then stop.

Our product: ${PRODUCT_CONTEXT}

Target account: ${account.name}${account.domain ? ` (${account.domain})` : ""} — market: ${playbook.marketName}.

Work in this order:
1. Call get_signals to fetch the account's persisted expansion-readiness signals.
2. Pick the ONE signal most indicative of international / Europe-expansion readiness and call select_signal with your reasoning.
3. Use web_search to identify a real, named decision-maker at ${account.name} relevant to that signal. Prefer senior buyer roles — Head of Global Partnerships, Business Development, Digital Transformation, Payments, Innovation — NOT client-facing roles like relationship managers.
4. Verify that person via enrich_contact. FullEnrich is the verification gate: never present an unverified person as a contact. Max 2 attempts; if the first fails you may try ONE different person.
5. Once a contact is verified, call write_draft with the outreach email.

Draft rules:
- Tone, structure and judgment must follow ONLY the team-authored market playbook below. Never invent cultural claims, named customers, proof points, ROI numbers, or compliance/local-presence claims not supported by the selected signal, the product one-liner, or the playbook.
- Draft in English, concise (about 120-180 words), reference the specific selected signal, and end with a clear next step.
- Grounding: only reference the selected signal and verified data. If nothing verifiable is available, be plain, not padded.

Team-authored market playbook — ${playbook.marketName}:
Cultural buying process:
${bullets(playbook.culturalBuyingProcess)}
Buyer psychology:
${bullets(playbook.buyerPsychology)}
Messaging judgment:
${bullets(playbook.messagingJudgment)}`;
}

// --- the pipeline ------------------------------------------------------------------

/**
 * Runs the full headless pipeline for one account. Never throws for
 * run-level failures — those are persisted to pipeline_runs.error and
 * returned as status "failed". An unknown accountId IS thrown (caller bug),
 * before any run row exists.
 */
export async function runPipeline(
	env: PipelineEnv,
	input: { accountId: string },
): Promise<RunPipelineResult> {
	const db = drizzle(env.DB);

	const [account] = await db
		.select()
		.from(targetAccounts)
		.where(eq(targetAccounts.id, input.accountId));
	if (!account) {
		throw new Error(`Unknown target account: ${input.accountId}`);
	}
	// Invariant 12: an out-of-scope market row has no playbook — a data bug,
	// not a run failure (the paid-call guards also live inside the tools).
	const playbook: MarketPlaybook | undefined = playbooks[account.market];
	if (!playbook) {
		throw new Error(
			`Account ${account.id} has out-of-scope market "${account.market}" — Phase 1 is JP/KR/SG only`,
		);
	}

	const [run] = await db
		.insert(pipelineRuns)
		.values({ accountId: account.id })
		.returning();

	const state: RunState = {
		runId: run.id,
		leadId: null,
		selectedSignalId: null,
		contactId: null,
		draftId: null,
		paidEnrichAttempts: 0,
		enrichFailures: 0,
		lastUsage: null,
		terminal: null,
	};
	const ctx: RunContext = { env, db, account, state };

	try {
		await runToolLoop(ctx, playbook);
		const terminal = state.terminal;
		if (!terminal) {
			throw new Error("pipeline loop ended without a terminal outcome");
		}
		await db
			.update(pipelineRuns)
			.set({ status: "done", stage: terminal.stage, finishedAt: new Date() })
			.where(eq(pipelineRuns.id, run.id));
		return {
			runId: run.id,
			leadId: state.leadId,
			draftId: state.draftId,
			stage: terminal.stage,
			status: "done",
			outcome: terminal.outcome,
			detail: terminal.detail,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await db
			.update(pipelineRuns)
			.set({
				status: "failed",
				stage: "failed",
				error: message,
				finishedAt: new Date(),
			})
			.where(eq(pipelineRuns.id, run.id));
		return {
			runId: run.id,
			leadId: state.leadId,
			draftId: state.draftId,
			stage: "failed",
			status: "failed",
			outcome: "error",
			detail: message.split("\n")[0] ?? "run failed",
		};
	}
}

// --- the model loop ---------------------------------------------------------------

async function runToolLoop(
	ctx: RunContext,
	playbook: MarketPlaybook,
): Promise<void> {
	// Key passed explicitly — the secret is named CLAUDE_API_KEY, not the
	// SDK's default env var.
	const anthropic = new Anthropic({ apiKey: ctx.env.CLAUDE_API_KEY });
	const system = buildSystemPrompt(ctx.account, playbook);
	const messages: Anthropic.MessageParam[] = [
		{
			role: "user",
			content:
				"Run the pipeline for this account now. Start by calling get_signals.",
		},
	];

	// web_search_20260209 executes via code execution in a server-side
	// container; a pause_turn resume with pending code-exec tool uses MUST
	// re-attach that container id (live-observed 400 without it).
	let container: string | undefined;
	for (let turn = 0; turn < MAX_TURNS; turn++) {
		const response = await anthropic.messages.create({
			model: MODEL,
			max_tokens: MAX_TOKENS,
			system,
			tools: TOOLS,
			messages,
			...(container ? { container } : {}),
		});
		ctx.state.lastUsage = response.usage;
		container = response.container?.id ?? container;

		if (response.stop_reason === "refusal") {
			throw new Error("model refused the pipeline task (stop_reason=refusal)");
		}
		// Server-tool loop pause (web_search): resume by re-sending the
		// conversation; counts toward the turn bound.
		if (response.stop_reason === "pause_turn") {
			messages.push({ role: "assistant", content: response.content });
			continue;
		}

		const toolUses = response.content.filter(
			(block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
		);
		if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
			// The model stopped on its own — terminal outcomes are only set by
			// the tools, so this is always a failure, not a silent partial run.
			throw new Error(
				ctx.state.contactId
					? "model ended without drafting despite a verified contact"
					: `model ended without completing the pipeline (stop_reason=${response.stop_reason})`,
			);
		}

		messages.push({ role: "assistant", content: response.content });
		const results: Anthropic.ToolResultBlockParam[] = [];
		for (const toolUse of toolUses) {
			const outcome = await dispatchTool(ctx, toolUse);
			results.push({
				type: "tool_result",
				tool_use_id: toolUse.id,
				content: JSON.stringify(outcome.value),
				...(outcome.isError ? { is_error: true } : {}),
			});
			// First-class end state (drafted / honest empty): stop here — the
			// model has nothing left to decide.
			if (ctx.state.terminal) return;
		}
		messages.push({ role: "user", content: results });
	}
	throw new Error(
		`turn bound exceeded (${MAX_TURNS} model turns) without a terminal outcome`,
	);
}

async function dispatchTool(
	ctx: RunContext,
	toolUse: Anthropic.ToolUseBlock,
): Promise<ToolOutcome> {
	switch (toolUse.name) {
		case "get_signals": {
			const parsed = getSignalsInputSchema.safeParse(toolUse.input);
			if (!parsed.success) return invalidInput(parsed.error);
			return handleGetSignals(ctx);
		}
		case "select_signal": {
			const parsed = selectSignalInputSchema.safeParse(toolUse.input);
			if (!parsed.success) return invalidInput(parsed.error);
			return handleSelectSignal(ctx, parsed.data);
		}
		case "enrich_contact": {
			const parsed = enrichContactInputSchema.safeParse(toolUse.input);
			if (!parsed.success) return invalidInput(parsed.error);
			return handleEnrichContact(ctx, parsed.data);
		}
		case "write_draft": {
			const parsed = writeDraftInputSchema.safeParse(toolUse.input);
			if (!parsed.success) return invalidInput(parsed.error);
			return handleWriteDraft(ctx, parsed.data);
		}
		default:
			return err(`Unknown tool: ${toolUse.name}`);
	}
}

// --- tool handlers ----------------------------------------------------------------

async function handleGetSignals(ctx: RunContext): Promise<ToolOutcome> {
	await setStage(ctx, "signals");
	const fetched = await getSignals(ctx.env, ctx.account.id);
	if (fetched.unmapped) {
		// Honest empty (invariant 2): account not on the Sillage list — done,
		// not failed, and no padding.
		ctx.state.terminal = {
			outcome: "unmapped_account",
			stage: "unmapped",
			detail: `Account ${ctx.account.id} is not mapped on the Sillage top-account list`,
		};
		return ok({ unmapped: true });
	}
	// getSignals returns only newly inserted rows — the model works from ALL
	// persisted signals for the account (most recent first, capped at 30).
	const rows = await ctx.db
		.select({
			id: signals.id,
			type: signals.type,
			summary: signals.summary,
			detectedAt: signals.detectedAt,
		})
		.from(signals)
		.where(eq(signals.accountId, ctx.account.id))
		.orderBy(desc(signals.detectedAt), desc(signals.createdAt));
	if (rows.length === 0) {
		ctx.state.terminal = {
			outcome: "no_signals",
			stage: "no-signals",
			detail: `No persisted signals for account ${ctx.account.id}`,
		};
		return ok({ count: 0, signals: [] });
	}
	return ok({
		count: rows.length,
		newly_inserted: fetched.inserted,
		signals: rows.slice(0, 30).map((row) => ({
			id: row.id,
			type: row.type,
			summary: row.summary,
			detected_at: row.detectedAt?.toISOString() ?? null,
		})),
	});
}

async function handleSelectSignal(
	ctx: RunContext,
	input: z.infer<typeof selectSignalInputSchema>,
): Promise<ToolOutcome> {
	if (ctx.state.leadId) {
		return err(
			"A signal was already selected for this run — continue with the existing lead.",
		);
	}
	// The signal id is model-chosen: verify it is a real persisted row of
	// THIS account before creating anything from it (invariant 2).
	const [signal] = await ctx.db
		.select({ id: signals.id })
		.from(signals)
		.where(
			and(
				eq(signals.id, input.signal_id),
				eq(signals.accountId, ctx.account.id),
			),
		);
	if (!signal) {
		return err(
			`Signal ${input.signal_id} does not belong to account ${ctx.account.id} — pick an id returned by get_signals.`,
		);
	}
	const [lead] = await ctx.db
		.insert(leads)
		.values({
			accountId: ctx.account.id,
			signalId: signal.id,
			stage: "signal",
			status: "draft",
		})
		.returning();
	ctx.state.leadId = lead.id;
	ctx.state.selectedSignalId = signal.id;
	await ctx.db
		.update(pipelineRuns)
		.set({ leadId: lead.id, stage: "signal-selected" })
		.where(eq(pipelineRuns.id, ctx.state.runId));
	return ok({ lead_id: lead.id });
}

async function handleEnrichContact(
	ctx: RunContext,
	input: z.infer<typeof enrichContactInputSchema>,
): Promise<ToolOutcome> {
	if (!ctx.state.leadId || !ctx.state.selectedSignalId) {
		return err("Call select_signal before enrich_contact.");
	}
	if (ctx.state.contactId) {
		return err("A verified contact already exists — call write_draft.");
	}
	// HARD BOUND: 2 paid attempts per run (reused rows don't count).
	if (ctx.state.paidEnrichAttempts >= MAX_PAID_ENRICH_ATTEMPTS) {
		return err(
			`Enrichment budget exhausted (${MAX_PAID_ENRICH_ATTEMPTS} paid attempts per run) — stop calling enrich_contact.`,
		);
	}

	await setStage(ctx, "enriching");
	const result = await enrichContact(ctx.env, {
		accountId: ctx.account.id,
		signalId: ctx.state.selectedSignalId,
		firstName: input.first_name,
		lastName: input.last_name,
		linkedinUrl: input.linkedin_url,
	});

	if (result.outcome === "contact") {
		if (!result.reused) ctx.state.paidEnrichAttempts += 1;
		ctx.state.contactId = result.contact.id;
		await ctx.db
			.update(leads)
			.set({ stage: "contact", primaryContactId: result.contact.id })
			.where(eq(leads.id, ctx.state.leadId));
		await setStage(ctx, "contact");
		// Compact + PII-lean tool_result: the model already knows the name it
		// asked for — no name/email flows back (invariant 9 posture).
		return ok({
			outcome: "contact",
			contact: {
				id: result.contact.id,
				title: result.contact.title,
				email_status: result.emailStatus,
				verified: result.contact.verified,
			},
		});
	}

	// no_verified_contact: a paid attempt that found nothing usable. Persist
	// the provenance durably on the lead (invariant 5 — never dropped, never
	// invented), then either allow ONE more person or end the run honestly.
	ctx.state.paidEnrichAttempts += 1;
	ctx.state.enrichFailures += 1;
	await ctx.db
		.update(leads)
		.set({
			stage: "no-contact",
			stageDetail: {
				reason: result.reason,
				enrichmentId: result.enrichmentId,
				rawResult: result.rawResult,
			},
		})
		.where(eq(leads.id, ctx.state.leadId));
	await setStage(ctx, "no-contact");
	if (ctx.state.enrichFailures >= MAX_PAID_ENRICH_ATTEMPTS) {
		ctx.state.terminal = {
			outcome: "no_verified_contact",
			stage: "no-contact",
			detail: `No verified contact after ${ctx.state.enrichFailures} enrichment attempts (lead ${ctx.state.leadId})`,
		};
		return ok({ outcome: "no_verified_contact", reason: result.reason });
	}
	return ok({
		outcome: "no_verified_contact",
		reason: result.reason,
		note: "You may try ONE different person (final attempt); otherwise stop.",
	});
}

async function handleWriteDraft(
	ctx: RunContext,
	input: z.infer<typeof writeDraftInputSchema>,
): Promise<ToolOutcome> {
	if (!ctx.state.leadId) {
		return err("Call select_signal before write_draft.");
	}
	// Invariant 5 gate: no draft without a verified/usable contact.
	if (!ctx.state.contactId) {
		return err(
			"write_draft requires a verified contact — call enrich_contact first.",
		);
	}

	const [draft] = await ctx.db
		.insert(drafts)
		.values({
			leadId: ctx.state.leadId,
			version: 1,
			// Single body column — subject folded into the stored body.
			body: `Subject: ${input.subject}\n\n${input.body}`,
			sourceTool: "pipeline_draft",
			// Provenance (invariant 2): every ref is a real persisted row id.
			rawPayload: {
				model: MODEL,
				runId: ctx.state.runId,
				leadId: ctx.state.leadId,
				signalId: ctx.state.selectedSignalId,
				contactId: ctx.state.contactId,
				playbookMarket: ctx.account.market,
				productContext: true,
				usage: ctx.state.lastUsage,
			},
		})
		.returning();
	ctx.state.draftId = draft.id;
	// Invariant 1: lead status stays "draft" — no send/approve path exists here.
	await ctx.db
		.update(leads)
		.set({ stage: "drafted" })
		.where(eq(leads.id, ctx.state.leadId));
	await setStage(ctx, "drafted");
	ctx.state.terminal = {
		outcome: "drafted",
		stage: "drafted",
		detail: `Draft ${draft.id} created for lead ${ctx.state.leadId}`,
	};
	return ok({ draft_id: draft.id });
}
