// Dev exercise for T-006: run the research_market tool once against the LOCAL
// D1 replica using the real Anthropic API (wrangler platform proxy reads
// .dev.vars and .wrangler/state). Explicitly human/agent-triggered — never
// scheduled (invariant 10). Usage:
//   bun scripts/dev-research-market.ts <account-id|domain> [product context...]
// Finds-or-creates a dev lead from a REAL persisted signal for the account.

import { getPlatformProxy } from "wrangler";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { leads, signals, targetAccounts } from "../src/lib/db/app.schema";
import { researchMarket } from "../src/lib/tools/research_market";

const [arg, ...contextWords] = process.argv.slice(2);
if (!arg) {
	console.error(
		"usage: bun scripts/dev-research-market.ts <account-id|domain> [product context...]",
	);
	process.exit(1);
}
const productContext =
	contextWords.join(" ") ||
	"a European B2B SaaS vendor expanding into Asia (demo product context)";

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

	// Find-or-create a lead backed by a real persisted signal.
	let [lead] = await db
		.select()
		.from(leads)
		.where(eq(leads.accountId, account.id));
	if (!lead) {
		const [signal] = await db
			.select()
			.from(signals)
			.where(eq(signals.accountId, account.id));
		if (!signal) {
			console.error(
				"No persisted signals for this account — run dev-get-signals first",
			);
			process.exit(1);
		}
		[lead] = await db
			.insert(leads)
			.values({ accountId: account.id, signalId: signal.id })
			.returning();
		console.log(`created dev lead ${lead.id} from signal ${signal.id}`);
	} else {
		console.log(`using existing lead ${lead.id}`);
	}

	const result = await researchMarket(proxy.env, {
		leadId: lead.id,
		productContext,
	});
	console.log(`outcome: ${result.outcome}`);
	console.log(`intel row: ${result.intel.id} (kind ${result.intel.kind})`);
	console.log(`note: ${result.intel.content}`);
	if (result.outcome === "competitors_found") {
		console.log(`citations (${result.citations.length}):`);
		for (const c of result.citations) {
			console.log(`  - ${c.title ?? "(untitled)"} — ${c.url}`);
		}
	}
} finally {
	await proxy.dispose();
}
