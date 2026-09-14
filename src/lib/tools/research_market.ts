// research_market tool (T-006): use Claude with the native web_search server
// tool to find 1–2 known LOCAL competitors in the lead's account market, and
// persist the note to `deal_intel` with full citation provenance (invariant 2).
// Tool type (web_search_20260209) and model id (claude-opus-4-8) verified
// against current Anthropic docs at implementation time (AGENTS.md §0).
// Empty findings are a first-class outcome — "none found", never filler.

import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { dealIntel, leads, targetAccounts } from "../db/app.schema";

const MODEL = "claude-opus-4-8";
// Bounded paid searches per run (invariant 10). Note: the _20260209 tool's
// dynamic filtering runs searches through code execution, and failed attempts
// also consume max_uses — 5 proved too tight in the live test (all uses burned
// before one verified result), so the bound is 10.
const MAX_SEARCHES = 10;
const MAX_PAUSE_RESUMES = 3; // bounded server-loop continuations (invariant 10)

const MARKET_NAMES: Record<string, string> = {
	jp: "Japan",
	kr: "South Korea",
	sg: "Singapore",
};

const NONE_FOUND_TOKEN = "NONE_FOUND";

export interface ResearchMarketInput {
	leadId: string;
	/**
	 * What "our" product does, so the competitor search targets the right
	 * space. Callers (the pipeline) pass the product one-liner from SPEC.
	 */
	productContext: string;
}

export type ResearchMarketResult =
	| {
			outcome: "competitors_found";
			intel: typeof dealIntel.$inferSelect;
			citations: { url: string; title: string | null }[];
	  }
	| {
			/** Honest empty: research ran, nothing verifiable found (invariant 2). */
			outcome: "none_found";
			intel: typeof dealIntel.$inferSelect;
	  };

export async function researchMarket(
	env: Pick<CloudflareEnv, "DB" | "CLAUDE_API_KEY">,
	input: ResearchMarketInput,
): Promise<ResearchMarketResult> {
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
	// Invariant 12 runtime guard, as in the other tools.
	if (!targetAccounts.market.enumValues.includes(account.market)) {
		throw new Error(
			`Account ${account.id} has out-of-scope market "${account.market}" — Phase 1 is JP/KR/SG only`,
		);
	}
	const marketName = MARKET_NAMES[account.market] ?? account.market;

	// Key passed explicitly — .dev.vars/Worker secret is named CLAUDE_API_KEY,
	// not the SDK's default env var (MEMORY.md decision).
	const anthropic = new Anthropic({ apiKey: env.CLAUDE_API_KEY });

	const messages: Anthropic.MessageParam[] = [
		{
			role: "user",
			content: `You are researching the competitive landscape for a B2B sales team.

Our product: ${input.productContext}

Target account: ${account.name}${account.domain ? ` (${account.domain})` : ""}, based in ${marketName}.

Find 1-2 known LOCAL competitors — vendors headquartered or strongly established in ${marketName} — that offer products in our product's space and could be alternatives the account would consider. Use web search to verify each competitor actually exists and is active in ${marketName}.

Respond with a short competitor note (2-4 sentences): name each competitor and why it is relevant to this account. Only name companies you verified through search. Output only the note itself — no preamble, no narration about your search process.

If you cannot verify any local competitor in this space, respond with exactly the single token ${NONE_FOUND_TOKEN} and nothing else. Never invent or pad.`,
		},
	];

	// One human-triggered run; web searches bounded by max_uses. The server
	// tool loop may pause (stop_reason "pause_turn") — resume a bounded number
	// of times by re-sending the conversation.
	let response = await anthropic.messages.create({
		model: MODEL,
		max_tokens: 8000,
		tools: [
			{
				type: "web_search_20260209",
				name: "web_search",
				max_uses: MAX_SEARCHES,
			},
		],
		messages,
	});
	for (
		let resumes = 0;
		response.stop_reason === "pause_turn" && resumes < MAX_PAUSE_RESUMES;
		resumes++
	) {
		messages.push({ role: "assistant", content: response.content });
		response = await anthropic.messages.create({
			model: MODEL,
			max_tokens: 8000,
			tools: [
				{
					type: "web_search_20260209",
					name: "web_search",
					max_uses: MAX_SEARCHES,
				},
			],
			messages,
		});
	}
	if (response.stop_reason === "refusal" || response.stop_reason === "pause_turn") {
		throw new Error(
			`research_market did not complete: stop_reason=${response.stop_reason}`,
		);
	}

	// Collect the answer text + grounding sources. Live-observed: with the
	// _20260209 tool (dynamic filtering via code execution) text blocks carry
	// NO span-level `citations` — grounding evidence is the successful
	// web_search_tool_result blocks themselves. Prefer span citations when
	// present; fall back to the consulted search-result URLs.
	// The note is the FINAL answer: only text after the last tool block —
	// narration between searches ("Let me verify…") is not part of the note.
	const lastToolIdx = response.content.reduce(
		(last, block, i) => (block.type === "text" ? last : i),
		-1,
	);
	let text = "";
	let searchResults = 0;
	const spanCitations: { url: string; title: string | null }[] = [];
	const consultedSources: { url: string; title: string | null }[] = [];
	const seenUrls = new Set<string>();
	for (const [index, block] of response.content.entries()) {
		if (block.type === "web_search_tool_result") {
			if (Array.isArray(block.content)) {
				searchResults += 1;
				for (const result of block.content) {
					if (result.type !== "web_search_result") continue;
					if (seenUrls.has(result.url)) continue;
					seenUrls.add(result.url);
					consultedSources.push({
						url: result.url,
						title: result.title ?? null,
					});
				}
			}
			continue;
		}
		if (block.type !== "text") continue;
		if (index > lastToolIdx) {
			text += block.text;
		}
		for (const citation of block.citations ?? []) {
			if (citation.type === "web_search_result_location") {
				spanCitations.push({ url: citation.url, title: citation.title });
			}
		}
	}
	text = text.trim();
	const citations =
		spanCitations.length > 0 ? spanCitations : consultedSources.slice(0, 10);

	// Provenance stored with the row (invariant 2): the full response content
	// (search tool calls + results + cited text), model and usage.
	const rawPayload = {
		model: response.model,
		usage: response.usage,
		stop_reason: response.stop_reason,
		content: response.content,
	};

	// Grounding gate (invariant 2): a "found" note requires that real web
	// searches succeeded in this response AND at least one source is
	// traceable — an unsearched/unsourced claim is not persisted as a finding.
	const noneFound =
		text === NONE_FOUND_TOKEN ||
		text.length === 0 ||
		searchResults === 0 ||
		citations.length === 0;

	const [intel] = await db
		.insert(dealIntel)
		.values({
			leadId: lead.id,
			kind: "competitor-note",
			content: noneFound
				? `No local competitors in ${marketName} could be verified for this account's space.`
				: text,
			sourceTool: "research_market",
			rawPayload,
		})
		.returning();

	return noneFound
		? { outcome: "none_found", intel }
		: { outcome: "competitors_found", intel, citations };
}
