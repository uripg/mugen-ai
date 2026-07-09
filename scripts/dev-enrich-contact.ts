// Dev exercise for T-005: run the enrich_contact tool once against the LOCAL
// D1 replica using the real FullEnrich API (wrangler platform proxy reads
// .dev.vars and .wrangler/state). Explicitly human/agent-triggered — never
// scheduled (invariant 10). Usage:
//   bun scripts/dev-enrich-contact.ts <account-id|domain> <first> <last> [linkedin_url]
// Output masks the enriched email and prints statuses/ids only (invariant 9).

import { getPlatformProxy } from "wrangler";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { targetAccounts } from "../src/lib/db/app.schema";
import { enrichContact } from "../src/lib/tools/enrich_contact";

const [arg, firstName, lastName, linkedinUrl] = process.argv.slice(2);
if (!arg || (!linkedinUrl && (!firstName || !lastName))) {
	console.error(
		"usage: bun scripts/dev-enrich-contact.ts <account-id|domain> <first> <last> [linkedin_url]",
	);
	process.exit(1);
}

function maskEmail(email: string | null): string {
	if (!email) return "—";
	const [local, domain] = email.split("@");
	return `${local?.[0] ?? "?"}***@${domain ?? "?"}`;
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
	const result = await enrichContact(proxy.env, {
		accountId: account.id,
		firstName,
		lastName,
		linkedinUrl,
	});
	if (result.outcome === "contact") {
		const { contact } = result;
		console.log(
			`outcome: contact${result.reused ? " (reused existing row — no paid call)" : ""}`,
		);
		console.log(`  row id:   ${contact.id}`);
		console.log(`  title:    ${contact.title ?? "—"}`);
		console.log(`  email:    ${maskEmail(contact.email)}`);
		console.log(
			`  status:   ${result.emailStatus} → verified=${contact.verified}`,
		);
	} else {
		console.log(
			`outcome: no verified contact (${result.reason}) — enrichment ${result.enrichmentId}, no row written`,
		);
	}
} finally {
	await proxy.dispose();
}
