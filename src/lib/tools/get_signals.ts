// get_signals tool (T-004): fetch Sillage V2 signal detections for one tracked
// account, map them onto the four SPEC §2.3 expansion-readiness types, and
// persist them to `signals` with full provenance (invariant 2). Endpoints and
// shapes verified against SILLAGE_API.md.

import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { signals, targetAccounts } from "../db/app.schema";
import { sillageFetch } from "./sillage";

// --- zod at the boundary (invariant 8) ---------------------------------------

const talAccountSchema = z.looseObject({
	id: z.number().optional(),
	company_id: z.number().optional(),
	company: z.looseObject({
		name: z.string().optional(),
		domain: z.string().optional(),
		status: z.string(),
	}),
});

const talResponseSchema = z.looseObject({
	data: z.array(talAccountSchema),
	meta: z.looseObject({
		pagination: z.looseObject({
			page: z.number(),
			page_count: z.number(),
		}),
	}),
});

// One V2 signal detection. `data` is the type-dependent payload — kept opaque
// here and persisted raw; the summary builders below validate the slice they
// read. Unknown fields pass through so the stored provenance is complete.
const detectionSchema = z.looseObject({
	id: z.number(),
	signal_type: z.string().nullish(),
	data: z.unknown().nullish(),
	detected_at: z.string().nullish(),
	signal_date: z.string().nullish(),
	lead_id: z.number().nullish(),
	company_id: z.number().nullish(),
	agent_id: z.number().nullish(),
});

const signalsQueryResponseSchema = z.looseObject({
	data: z.array(detectionSchema),
	meta: z.looseObject({
		next_cursor: z.string().nullable(),
		has_more: z.boolean(),
	}),
});

type Detection = z.infer<typeof detectionSchema>;

const jobUpdateDataSchema = z.looseObject({
	previous_position: z
		.looseObject({
			role: z.string().nullish(),
			company_name: z.string().nullish(),
		})
		.nullish(),
	new_position: z
		.looseObject({
			role: z.string().nullish(),
			company_name: z.string().nullish(),
			start_date: z.string().nullish(),
		})
		.nullish(),
});

const jobPostingDataSchema = z.looseObject({
	posting: z
		.looseObject({
			title: z.string().nullish(),
			location: z.string().nullish(),
		})
		.nullish(),
	job_title: z.string().nullish(),
	keywords_found: z.array(z.string()).nullish(),
});

const deepSearchDataSchema = z.looseObject({
	title: z.string().nullish(),
	tag: z.string().nullish(),
	date: z.string().nullish(),
});

// --- signal-type mapping (SPEC §2.3 / invariant 12 scope) --------------------

type SpecSignalType = (typeof signals.type.enumValues)[number];

// Deterministic (non-AI) mapping from Sillage V2 signal types to the four SPEC
// types. Anything not listed is deliberately dropped — surfacing only the four
// expansion-readiness types is an acceptance criterion, not thin data.
function mapDetection(
	d: Detection,
): { type: SpecSignalType; summary: string } | null {
	switch (d.signal_type) {
		case "newJob":
		case "recentlyPromoted": {
			const parsed = jobUpdateDataSchema.safeParse(d.data);
			const next = parsed.success ? parsed.data.new_position : null;
			const prev = parsed.success ? parsed.data.previous_position : null;
			const to =
				next?.role || next?.company_name
					? `${next?.role ?? "new role"}${next?.company_name ? ` at ${next.company_name}` : ""}`
					: "a new position";
			const from =
				prev?.role || prev?.company_name
					? ` (previously ${prev?.role ?? "role unknown"}${prev?.company_name ? ` at ${prev.company_name}` : ""})`
					: "";
			return {
				type: "exec-join",
				summary: `${d.signal_type === "recentlyPromoted" ? "Promotion" : "Job change"}: ${to}${from}`,
			};
		}
		case "jobPosting":
		case "jobPostingInsight":
		case "jobPostingHiringManager":
		case "jobPostingKeywordDetection": {
			const parsed = jobPostingDataSchema.safeParse(d.data);
			const posting = parsed.success ? parsed.data.posting : null;
			const title = posting?.title ?? "role";
			const location = posting?.location ? ` — ${posting.location}` : "";
			return {
				type: "hiring",
				summary: `Job posting: ${title}${location}`,
			};
		}
		case "competitorInboundComment":
		case "competitorOutboundComment":
			return {
				type: "competitor-engagement",
				summary:
					d.signal_type === "competitorInboundComment"
						? "Competitor engagement: comment received on tracked content"
						: "Competitor engagement: comment on a competitor's post",
			};
		case "deepSearch": {
			const parsed = deepSearchDataSchema.safeParse(d.data);
			if (!parsed.success) return null;
			const { tag, title, date } = parsed.data;
			if (tag !== "funding" && tag !== "hiring") return null;
			return {
				type: tag === "funding" ? "funding" : "hiring",
				summary: `${title ?? (tag === "funding" ? "Funding event" : "Hiring event")}${date ? ` (${date})` : ""}`,
			};
		}
		default:
			return null;
	}
}

// --- TAL resolution -----------------------------------------------------------

function normalizeName(name: string): string {
	return name.toLowerCase().replace(/\s+/g, "");
}

function normalizeDomain(domain: string): string {
	return domain.toLowerCase().replace(/^www\./, "");
}

// Resolve our account to its Sillage company id via the top-account list
// (found accounts only), matching by domain first, then by normalized name.
async function resolveSillageCompanyId(
	env: Pick<CloudflareEnv, "SILLAGE_API_KEY">,
	account: { name: string; domain: string | null },
): Promise<number | null> {
	const wantedDomain = account.domain ? normalizeDomain(account.domain) : null;
	const wantedName = normalizeName(account.name);

	let page = 1;
	let pageCount = 1;
	while (page <= pageCount && page <= 10) {
		const raw = await sillageFetch<unknown>(
			env,
			`/v2/top-account-list/accounts?page=${page}&page_size=100`,
		);
		const parsed = talResponseSchema.parse(raw);
		for (const entry of parsed.data) {
			const companyId = entry.company_id ?? entry.id;
			if (companyId === undefined) continue;
			const entryDomain = entry.company.domain
				? normalizeDomain(entry.company.domain)
				: null;
			const entryName = entry.company.name
				? normalizeName(entry.company.name)
				: null;
			if (
				(wantedDomain && entryDomain === wantedDomain) ||
				(entryName && entryName === wantedName)
			) {
				return companyId;
			}
		}
		pageCount = parsed.meta.pagination.page_count;
		page += 1;
	}
	return null;
}

// --- the tool -----------------------------------------------------------------

export interface GetSignalsResult {
	accountId: string;
	sillageCompanyId: number | null;
	/** Account not (yet) resolvable on the Sillage top-account list. */
	unmapped: boolean;
	/** Raw detections returned by Sillage for this account. */
	fetched: number;
	/** Detections that map to one of the four SPEC signal types. */
	matched: number;
	inserted: number;
	skippedExisting: number;
	signals: (typeof signals.$inferSelect)[];
}

const MAX_PAGES = 5;

export async function getSignals(
	env: Pick<CloudflareEnv, "DB" | "SILLAGE_API_KEY">,
	accountId: string,
): Promise<GetSignalsResult> {
	const db = drizzle(env.DB);

	const [account] = await db
		.select()
		.from(targetAccounts)
		.where(eq(targetAccounts.id, accountId));
	if (!account) {
		throw new Error(`Unknown target account: ${accountId}`);
	}
	// Invariant 12 runtime guard: the TS enum doesn't constrain what's already
	// in D1 — refuse to spend Sillage calls on an out-of-scope market row.
	if (!targetAccounts.market.enumValues.includes(account.market)) {
		throw new Error(
			`Account ${accountId} has out-of-scope market "${account.market}" — Phase 1 is JP/KR/SG only`,
		);
	}

	// Resolve + cache the Sillage company id on first use.
	let sillageCompanyId = account.sillageId
		? Number(account.sillageId)
		: null;
	if (sillageCompanyId === null || Number.isNaN(sillageCompanyId)) {
		sillageCompanyId = await resolveSillageCompanyId(env, account);
		if (sillageCompanyId !== null) {
			await db
				.update(targetAccounts)
				.set({ sillageId: String(sillageCompanyId) })
				.where(eq(targetAccounts.id, account.id));
		}
	}

	if (sillageCompanyId === null) {
		// Honest empty (invariant 2): the account isn't on the Sillage list —
		// report that, never pad.
		return {
			accountId: account.id,
			sillageCompanyId: null,
			unmapped: true,
			fetched: 0,
			matched: 0,
			inserted: 0,
			skippedExisting: 0,
			signals: [],
		};
	}

	// Fetch all detections for the company (cursor-paginated, bounded). The v2
	// `type` request filter omits deepSearch/jobPosting even though responses
	// include them, so we fetch unfiltered and map client-side.
	const detections: Detection[] = [];
	let cursor: string | undefined;
	for (let i = 0; i < MAX_PAGES; i++) {
		const raw = await sillageFetch<unknown>(env, "/v2/workspace/signals/query", {
			method: "POST",
			body: {
				company_id: sillageCompanyId,
				limit: 100,
				...(cursor ? { cursor } : {}),
			},
		});
		const parsed = signalsQueryResponseSchema.parse(raw);
		detections.push(...parsed.data);
		if (!parsed.meta.has_more || !parsed.meta.next_cursor) break;
		cursor = parsed.meta.next_cursor;
	}

	// Dedupe against already-persisted detections (Sillage detection id lives
	// in the stored raw payload).
	const existing = await db
		.select({ rawPayload: signals.rawPayload })
		.from(signals)
		.where(eq(signals.accountId, account.id));
	const seenDetectionIds = new Set(
		existing
			.map((row) => (row.rawPayload as { id?: number } | null)?.id)
			.filter((id): id is number => typeof id === "number"),
	);

	const result: GetSignalsResult = {
		accountId: account.id,
		sillageCompanyId,
		unmapped: false,
		fetched: detections.length,
		matched: 0,
		inserted: 0,
		skippedExisting: 0,
		signals: [],
	};

	for (const detection of detections) {
		const mapped = mapDetection(detection);
		if (!mapped) continue;
		result.matched += 1;
		if (seenDetectionIds.has(detection.id)) {
			result.skippedExisting += 1;
			continue;
		}
		const detectedAtRaw = detection.detected_at ?? detection.signal_date;
		const detectedAt = detectedAtRaw ? new Date(detectedAtRaw) : null;
		const [inserted] = await db
			.insert(signals)
			.values({
				accountId: account.id,
				type: mapped.type,
				summary: mapped.summary,
				sourceTool: "get_signals",
				rawPayload: detection,
				detectedAt:
					detectedAt && !Number.isNaN(detectedAt.getTime())
						? detectedAt
						: null,
			})
			.returning();
		result.inserted += 1;
		result.signals.push(inserted);
	}

	return result;
}
