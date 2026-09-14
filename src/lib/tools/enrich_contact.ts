// enrich_contact tool (T-005): resolve a person at a target account into a
// verified contact via FullEnrich bulk enrichment (async: start + bounded
// polling), and persist a `contacts` row ONLY for a real verified result with
// full provenance (invariants 2, 5). The no-result case is a first-class
// outcome — "no verified contact", never an invention. Endpoints, shapes and
// email-status semantics verified against https://docs.fullenrich.com (v2).

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { contacts, targetAccounts } from "../db/app.schema";
import { FullEnrichError, fullenrichFetch } from "./fullenrich";

// --- zod at the boundary (invariant 8) ---------------------------------------

const startResponseSchema = z.looseObject({
	enrichment_id: z.string(),
});

const emailSchema = z.looseObject({
	email: z.string(),
	// Documented: DELIVERABLE | HIGH_PROBABILITY | CATCH_ALL | INVALID |
	// INVALID_DOMAIN — kept as string so an undocumented status degrades to
	// "not usable" instead of a validation crash.
	status: z.string(),
});

const contactResultSchema = z.looseObject({
	input: z.looseObject({
		first_name: z.string().nullish(),
		last_name: z.string().nullish(),
		full_name: z.string().nullish(),
	}),
	contact_info: z
		.looseObject({
			most_probable_work_email: emailSchema.nullish(),
			work_emails: z.array(emailSchema).nullish(),
		})
		.nullish(),
	profile: z
		.looseObject({
			full_name: z.string().nullish(),
			social_profiles: z
				.looseObject({
					professional_network: z
						.looseObject({ url: z.string().nullish() })
						.nullish(),
				})
				.nullish(),
			employment: z
				.looseObject({
					current: z
						.looseObject({ title: z.string().nullish() })
						.nullish(),
				})
				.nullish(),
		})
		.nullish(),
});

// Live-observed: while CREATED/IN_PROGRESS the GET can return 200 *without*
// `data` (the documented 400 error.enrichment.in_progress also occurs) — so
// `data` is optional and defaulted.
const enrichmentResultSchema = z.looseObject({
	id: z.string(),
	status: z.string(),
	data: z.array(contactResultSchema).default([]),
});

type ContactResult = z.infer<typeof contactResultSchema>;

// FullEnrich email-status docs: DELIVERABLE ≈ 2% bounce (verified),
// HIGH_PROBABILITY ≈ 9% bounce (triple-verified catch-all — usable, but not
// claimed as verified). CATCH_ALL / INVALID / anything else is not usable.
const USABLE_EMAIL_STATUSES = new Set(["DELIVERABLE", "HIGH_PROBABILITY"]);

// --- polling bounds (invariant 10: bounded, explicit runs only) ---------------

const POLL_INITIAL_WAIT_MS = 5_000;
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 48; // ≈ 4 minutes total (24 proved too tight under live load)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- the tool -----------------------------------------------------------------

export interface EnrichContactInput {
	accountId: string;
	/** Signal this enrichment resolves, if any (stored on the contact row). */
	signalId?: string;
	firstName?: string;
	lastName?: string;
	/** Alternative to the name pair; also improves match rates. */
	linkedinUrl?: string;
	/** Default: the account's domain / name. */
	domain?: string;
	companyName?: string;
}

export type EnrichContactResult =
	| {
			outcome: "contact";
			/** True when an existing row was returned without a paid call. */
			reused: boolean;
			contact: typeof contacts.$inferSelect;
			emailStatus: string;
	  }
	| {
			outcome: "no_verified_contact";
			reason: "not_found" | "no_usable_email";
			enrichmentId: string;
			/** Raw FullEnrich result so callers can persist honest provenance. */
			rawResult: unknown;
	  };

function normalizeName(name: string): string {
	return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function enrichContact(
	env: Pick<CloudflareEnv, "DB" | "FULLENRICH_API_KEY">,
	input: EnrichContactInput,
): Promise<EnrichContactResult> {
	const db = drizzle(env.DB);

	const hasNamePair = Boolean(input.firstName && input.lastName);
	if (!hasNamePair && !input.linkedinUrl) {
		throw new Error(
			"enrich_contact needs firstName+lastName or a linkedinUrl",
		);
	}

	const [account] = await db
		.select()
		.from(targetAccounts)
		.where(eq(targetAccounts.id, input.accountId));
	if (!account) {
		throw new Error(`Unknown target account: ${input.accountId}`);
	}
	// Invariant 12 runtime guard (same as get_signals): never spend a paid call
	// on an out-of-scope market row.
	if (!targetAccounts.market.enumValues.includes(account.market)) {
		throw new Error(
			`Account ${input.accountId} has out-of-scope market "${account.market}" — Phase 1 is JP/KR/SG only`,
		);
	}

	// Spend containment: an already-enriched person at this account is returned
	// as-is instead of paying FullEnrich again.
	const existingRows = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.accountId, account.id)));
	const wantedName =
		input.firstName && input.lastName
			? normalizeName(`${input.firstName} ${input.lastName}`)
			: null;
	const existing = existingRows.find(
		(row) =>
			(wantedName && normalizeName(row.name) === wantedName) ||
			(input.linkedinUrl &&
				row.linkedinUrl &&
				row.linkedinUrl === input.linkedinUrl),
	);
	if (existing) {
		// Real status comes from the stored provenance payload — never invented.
		const stored = contactResultSchema.safeParse(existing.rawPayload);
		return {
			outcome: "contact",
			reused: true,
			contact: existing,
			emailStatus:
				(stored.success
					? stored.data.contact_info?.most_probable_work_email?.status
					: undefined) ?? "UNKNOWN",
		};
	}

	const domain = input.domain ?? account.domain ?? undefined;
	const companyName = input.companyName ?? account.name;

	// Start the (async) enrichment — work emails only: drafts need a verified
	// work email, not phones/personal emails (1 credit vs 10/3).
	const startRaw = await fullenrichFetch<unknown>(env, "/contact/enrich/bulk", {
		method: "POST",
		body: {
			name: `mugen-ai ${account.name}`,
			data: [
				{
					...(hasNamePair
						? {
								first_name: input.firstName,
								last_name: input.lastName,
							}
						: {}),
					...(domain ? { domain } : { company_name: companyName }),
					...(input.linkedinUrl
						? { linkedin_url: input.linkedinUrl }
						: {}),
					enrich_fields: ["contact.work_emails"],
				},
			],
		},
	});
	const { enrichment_id: enrichmentId } = startResponseSchema.parse(startRaw);

	// Bounded polling. 400 error.enrichment.in_progress is the documented
	// "not ready yet" reply; a run that exhausts the budget is a FAILURE (throw),
	// never reported as "no verified contact".
	await sleep(POLL_INITIAL_WAIT_MS);
	let result: z.infer<typeof enrichmentResultSchema> | null = null;
	for (let i = 0; i < MAX_POLLS; i++) {
		let raw: unknown;
		try {
			raw = await fullenrichFetch<unknown>(
				env,
				`/contact/enrich/bulk/${enrichmentId}`,
			);
		} catch (err) {
			if (
				err instanceof FullEnrichError &&
				err.code === "error.enrichment.in_progress"
			) {
				await sleep(POLL_INTERVAL_MS);
				continue;
			}
			throw err;
		}
		const parsed = enrichmentResultSchema.parse(raw);
		if (parsed.status === "FINISHED") {
			result = parsed;
			break;
		}
		if (parsed.status === "CREATED" || parsed.status === "IN_PROGRESS") {
			await sleep(POLL_INTERVAL_MS);
			continue;
		}
		// CANCELED / CREDITS_INSUFFICIENT / RATE_LIMIT / UNKNOWN — a failed run,
		// not an honest empty result.
		throw new FullEnrichError(
			`FullEnrich enrichment ${enrichmentId} ended in status ${parsed.status}`,
		);
	}
	if (!result) {
		throw new FullEnrichError(
			`FullEnrich enrichment ${enrichmentId} not finished after ${MAX_POLLS} polls — giving up (bounded retries)`,
		);
	}

	return persistIfVerified(db, account.id, input, enrichmentId, result);
}

async function persistIfVerified(
	db: ReturnType<typeof drizzle>,
	accountId: string,
	input: EnrichContactInput,
	enrichmentId: string,
	result: z.infer<typeof enrichmentResultSchema>,
): Promise<EnrichContactResult> {
	const item: ContactResult | undefined = result.data[0];
	if (!item) {
		return {
			outcome: "no_verified_contact",
			reason: "not_found",
			enrichmentId,
			rawResult: result,
		};
	}

	// Only FullEnrich's own most-probable pick counts (plan/acceptance
	// semantics): it is the provider's best choice with INVALID excluded — if
	// it isn't usable, anything else in work_emails is a worse bet, not a
	// verified contact.
	const best = item.contact_info?.most_probable_work_email;
	if (!best || !USABLE_EMAIL_STATUSES.has(best.status)) {
		// Invariant 5: no usable email → "no verified contact", no row, no
		// invention. (A profile alone is not a contact we could reach.)
		return {
			outcome: "no_verified_contact",
			reason: best ? "no_usable_email" : "not_found",
			enrichmentId,
			rawResult: result,
		};
	}

	const name =
		item.profile?.full_name ??
		item.input.full_name ??
		[input.firstName, input.lastName].filter(Boolean).join(" ");
	const [row] = await db
		.insert(contacts)
		.values({
			accountId,
			signalId: input.signalId ?? null,
			name,
			title: item.profile?.employment?.current?.title ?? null,
			email: best.email,
			linkedinUrl:
				item.profile?.social_profiles?.professional_network?.url ??
				input.linkedinUrl ??
				null,
			// Provider-grounded semantics (email-status docs): DELIVERABLE is
			// verified; HIGH_PROBABILITY is usable but stored unverified.
			verified: best.status === "DELIVERABLE",
			committeeRole: null, // assigned at deal-intel time (T-010)
			sourceTool: "enrich_contact",
			rawPayload: item,
		})
		.returning();

	return {
		outcome: "contact",
		reused: false,
		contact: row,
		emailStatus: best.status,
	};
}
