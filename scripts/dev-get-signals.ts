// Dev exercise for T-004: run the get_signals tool once against the LOCAL D1
// replica using the real Sillage API (wrangler platform proxy reads .dev.vars
// and .wrangler/state). Explicitly human/agent-triggered — never scheduled
// (invariant 10). Usage:
//   bun scripts/dev-get-signals.ts <account-id|domain>
// Output is counts + non-PII summaries only (invariant 9).

import { getPlatformProxy } from "wrangler";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { targetAccounts } from "../src/lib/db/app.schema";
import { getSignals } from "../src/lib/tools/get_signals";

const arg = process.argv[2];
if (!arg) {
	console.error("usage: bun scripts/dev-get-signals.ts <account-id|domain>");
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
	const result = await getSignals(proxy.env, account.id);
	console.log(
		`sillage company id: ${result.sillageCompanyId ?? "—"}${result.unmapped ? " (NOT on the Sillage top-account list)" : ""}`,
	);
	console.log(
		`fetched ${result.fetched} detections → ${result.matched} matched a SPEC type → ${result.inserted} inserted, ${result.skippedExisting} already stored`,
	);
	for (const signal of result.signals) {
		console.log(`  [${signal.type}] ${signal.summary}`);
	}
} finally {
	await proxy.dispose();
}
