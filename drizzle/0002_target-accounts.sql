CREATE TABLE `target_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`market` text NOT NULL,
	`domain` text,
	`sillage_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`signal_id` text,
	`name` text NOT NULL,
	`title` text,
	`email` text,
	`linkedin_url` text,
	`verified` integer DEFAULT false NOT NULL,
	`committee_role` text,
	`source_tool` text DEFAULT 'enrich_contact' NOT NULL,
	`raw_payload` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `target_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_contacts`("id", "account_id", "signal_id", "name", "title", "email", "linkedin_url", "verified", "committee_role", "source_tool", "raw_payload", "created_at") SELECT "id", "account_id", "signal_id", "name", "title", "email", "linkedin_url", "verified", "committee_role", "source_tool", "raw_payload", "created_at" FROM `contacts`;--> statement-breakpoint
DROP TABLE `contacts`;--> statement-breakpoint
ALTER TABLE `__new_contacts` RENAME TO `contacts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `contacts_account_idx` ON `contacts` (`account_id`);--> statement-breakpoint
CREATE TABLE `__new_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`signal_id` text NOT NULL,
	`primary_contact_id` text,
	`stage` text DEFAULT 'signal' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`score` integer,
	`score_reasoning` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `target_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`primary_contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "leads_score_has_reasoning" CHECK(("__new_leads"."score" IS NULL OR ("__new_leads"."score_reasoning" IS NOT NULL AND "__new_leads"."score" BETWEEN 0 AND 100)))
);
--> statement-breakpoint
INSERT INTO `__new_leads`("id", "account_id", "signal_id", "primary_contact_id", "stage", "status", "score", "score_reasoning", "created_at", "updated_at") SELECT "id", "account_id", "signal_id", "primary_contact_id", "stage", "status", "score", "score_reasoning", "created_at", "updated_at" FROM `leads`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
ALTER TABLE `__new_leads` RENAME TO `leads`;--> statement-breakpoint
CREATE INDEX `leads_account_idx` ON `leads` (`account_id`);--> statement-breakpoint
CREATE TABLE `__new_pipeline_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`lead_id` text,
	`stage` text DEFAULT 'starting' NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `target_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_pipeline_runs`("id", "account_id", "lead_id", "stage", "status", "error", "created_at", "finished_at") SELECT "id", "account_id", "lead_id", "stage", "status", "error", "created_at", "finished_at" FROM `pipeline_runs`;--> statement-breakpoint
DROP TABLE `pipeline_runs`;--> statement-breakpoint
ALTER TABLE `__new_pipeline_runs` RENAME TO `pipeline_runs`;--> statement-breakpoint
CREATE TABLE `__new_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`summary` text NOT NULL,
	`source_tool` text DEFAULT 'get_signals' NOT NULL,
	`raw_payload` text NOT NULL,
	`detected_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `target_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_signals`("id", "account_id", "type", "summary", "source_tool", "raw_payload", "detected_at", "created_at") SELECT "id", "account_id", "type", "summary", "source_tool", "raw_payload", "detected_at", "created_at" FROM `signals`;--> statement-breakpoint
DROP TABLE `signals`;--> statement-breakpoint
ALTER TABLE `__new_signals` RENAME TO `signals`;--> statement-breakpoint
CREATE INDEX `signals_account_idx` ON `signals` (`account_id`);