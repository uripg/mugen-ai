// Dev exercise for T-007: run the full pipeline once for an account against the
// LOCAL D1 replica using real APIs (wrangler platform proxy reads .dev.vars and
// .wrangler/state). Explicitly human/agent-triggered — never scheduled
// (invariant 10). Usage:
//   bun scripts/dev-pipeline-run.ts <account-id|domain>
// Output prints ids/statuses only for contacts (invariant 9); the draft body is
// the deliverable and is printed in full.

import { getPlatformProxy } from "wrangler";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { drafts, targetAccounts } from "../src/lib/db/app.schema";
import { runPipeline } from "../src/lib/pipeline/run";

const [arg] = process.argv.slice(2);
if (!arg) {
	console.error("usage: bun scripts/dev-pipeline-run.ts <account-id|domain>");
	process.exit(1);
}

const proxy = await getPlatformProxy<CloudflareEnv>({ persist: true });
try {
	const db = drizzle(proxy.env.DB);
	const [account] = await db
		.select()
		.from(targetAccounts)
		.where(or(eq(targetAccounts.id, arg), eq(targetAccounts.domain, arg)));
	if (!account) {
		console.error(`No target account matching "${arg}"`);
		process.exit(1);
	}
	console.log(`account: ${account.name} [${account.market}] (${account.id})`);

	const result = await runPipeline(proxy.env, { accountId: account.id });
	console.log(`run:     ${result.runId}`);
	console.log(`lead:    ${result.leadId ?? "—"}`);
	console.log(`draft:   ${result.draftId ?? "—"}`);
	console.log(`stage:   ${result.stage}`);
	console.log(`status:  ${result.status}`);
	console.log(`outcome: ${result.outcome}`);
	console.log(`detail:  ${result.detail}`);

	if (result.draftId) {
		const [draft] = await db
			.select()
			.from(drafts)
			.where(eq(drafts.id, result.draftId));
		if (draft) {
			console.log(`\ndraft ${draft.id} (v${draft.version}, ${draft.sourceTool}):`);
			console.log("---");
			console.log(draft.body);
			console.log("---");
		}
	}
} finally {
	await proxy.dispose();
}
