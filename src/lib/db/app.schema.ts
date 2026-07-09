import { sql } from "drizzle-orm";
import {
	sqliteTable,
	text,
	integer,
	check,
	index,
} from "drizzle-orm/sqlite-core";

// App tables per ARCHITECTURE.md §3. Provenance rule (AGENTS.md invariant 2):
// every row produced from a tool call stores which tool and the raw payload it
// came from, so the why-panel can trace each data point to a real call.

const id = () =>
	text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
	integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull();

export const targetAccounts = sqliteTable("target_accounts", {
	id: id(),
	name: text("name").notNull(),
	market: text("market", { enum: ["jp", "kr", "sg"] }).notNull(),
	domain: text("domain"),
	sillageId: text("sillage_id"),
	createdAt: createdAt(),
});

export const signals = sqliteTable(
	"signals",
	{
		id: id(),
		accountId: text("account_id")
			.notNull()
			.references(() => targetAccounts.id),
		type: text("type", {
			enum: [
				"hiring",
				"exec-join",
				"competitor-engagement",
				"funding",
			],
		}).notNull(),
		summary: text("summary").notNull(),
		sourceTool: text("source_tool").notNull().default("get_signals"),
		rawPayload: text("raw_payload", { mode: "json" }).notNull(),
		detectedAt: integer("detected_at", { mode: "timestamp_ms" }),
		createdAt: createdAt(),
	},
	(t) => [index("signals_account_idx").on(t.accountId)],
);

export const contacts = sqliteTable(
	"contacts",
	{
		id: id(),
		accountId: text("account_id")
			.notNull()
			.references(() => targetAccounts.id),
		signalId: text("signal_id").references(() => signals.id),
		name: text("name").notNull(),
		title: text("title"),
		email: text("email"),
		linkedinUrl: text("linkedin_url"),
		// Invariant 5: a row exists only for a real FullEnrich result (rawPayload
		// is NOT NULL); `verified` records the provider's verification state and
		// must be set explicitly — no default, so no silent "verified" claims.
		verified: integer("verified", { mode: "boolean" }).notNull(),
		committeeRole: text("committee_role", {
			enum: [
				"champion",
				"economic-buyer",
				"technical-evaluator",
				"executive-sponsor",
			],
		}),
		sourceTool: text("source_tool").notNull().default("enrich_contact"),
		rawPayload: text("raw_payload", { mode: "json" }).notNull(),
		createdAt: createdAt(),
	},
	(t) => [index("contacts_account_idx").on(t.accountId)],
);

export const leads = sqliteTable(
	"leads",
	{
		id: id(),
		accountId: text("account_id")
			.notNull()
			.references(() => targetAccounts.id),
		signalId: text("signal_id")
			.notNull()
			.references(() => signals.id),
		primaryContactId: text("primary_contact_id").references(
			() => contacts.id,
		),
		stage: text("stage", {
			enum: [
				"signal",
				"contact",
				"intel",
				"scored",
				"drafted",
				"failed",
			],
		})
			.notNull()
			.default("signal"),
		status: text("status", {
			enum: ["draft", "approved", "edited", "sent-simulated"],
		})
			.notNull()
			.default("draft"),
		score: integer("score"),
		scoreReasoning: text("score_reasoning"),
		// Invariant 2: which persisted rows (signal/contact/deal_intel ids) the
		// score was computed from — the why-panel traces the score through these.
		scoreSourceRefs: text("score_source_refs", { mode: "json" }),
		createdAt: createdAt(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => [
		index("leads_account_idx").on(t.accountId),
		// Invariant 3 at the data layer: a score may never exist without its
		// reasoning (and must stay 0–100).
		check(
			"leads_score_has_reasoning",
			sql`(${t.score} IS NULL OR (${t.scoreReasoning} IS NOT NULL AND ${t.scoreSourceRefs} IS NOT NULL AND ${t.score} BETWEEN 0 AND 100))`,
		),
	],
);

export const dealIntel = sqliteTable("deal_intel", {
	id: id(),
	leadId: text("lead_id")
		.notNull()
		.references(() => leads.id),
	kind: text("kind", {
		enum: [
			"cultural-note",
			"psychology-note",
			"competitor-note",
			"repositioned-value-prop",
		],
	}).notNull(),
	content: text("content").notNull(),
	// cultural/psychology notes: which team-authored playbook entry was quoted
	// (invariant 4); competitor notes: research_market citations.
	playbookKey: text("playbook_key"),
	sourceTool: text("source_tool").notNull(),
	rawPayload: text("raw_payload", { mode: "json" }),
	createdAt: createdAt(),
});

export const drafts = sqliteTable("drafts", {
	id: id(),
	leadId: text("lead_id")
		.notNull()
		.references(() => leads.id),
	version: integer("version").notNull().default(1),
	body: text("body").notNull(),
	editedBody: text("edited_body"),
	// Invariant 2: drafts are AI-produced — record the producing tool/model and
	// the inputs it was drafted from (value-prop/intel/contact row refs).
	sourceTool: text("source_tool").notNull(),
	rawPayload: text("raw_payload", { mode: "json" }).notNull(),
	createdAt: createdAt(),
});

export const pipelineRuns = sqliteTable("pipeline_runs", {
	id: id(),
	accountId: text("account_id")
		.notNull()
		.references(() => targetAccounts.id),
	leadId: text("lead_id").references(() => leads.id),
	stage: text("stage").notNull().default("starting"),
	status: text("status", {
		enum: ["running", "done", "failed"],
	})
		.notNull()
		.default("running"),
	error: text("error"),
	startedAt: createdAt(),
	finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
});
