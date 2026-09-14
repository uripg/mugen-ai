import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "../db/auth.schema";

// AGENTS.md §2 sharp edge: the auth instance is created PER-REQUEST with that
// request's D1/KV bindings — never held at module scope with live bindings.
export function createAuth(
	env?: CloudflareEnv,
	cf?: IncomingRequestCfProperties,
	baseURL?: string,
) {
	const db = env ? drizzle(env.DB, { schema }) : ({} as never);

	return betterAuth({
		baseURL,
		secret: env?.BETTER_AUTH_SECRET,
		...withCloudflare(
			{
				autoDetectIpAddress: true,
				geolocationTracking: false,
				cf: cf || {},
				d1: env ? { db, options: { usePlural: true } } : undefined,
				// Cast: the generated CloudflareEnv KV type is structurally identical
				// to @cloudflare/workers-types' KVNamespace the lib expects.
				kv: env?.KV as unknown as Parameters<
					typeof withCloudflare
				>[0]["kv"],
			},
			{
				emailAndPassword: {
					enabled: true,
					// Team-only shared login (SPEC §2 IN-1): signup stays closed
					// except during the one-time seeding deploy (ALLOW_SIGNUP=true).
					disableSignUp:
						(env?.ALLOW_SIGNUP as string | undefined) !== "true",
				},
				// AGENTS.md §2 sharp edge: KV minimum TTL is 60s — window must be ≥ 60.
				rateLimit: { enabled: true, window: 60, max: 100 },
			},
		),
		// CLI-only fallback so `@better-auth/cli generate` can introspect the
		// config without live bindings.
		...(env
			? {}
			: {
					database: drizzleAdapter({} as never, {
						provider: "sqlite",
						usePlural: true,
					}),
				}),
	});
}

export async function initAuth() {
	const { env, cf } = await getCloudflareContext({ async: true });
	return createAuth(env, cf as IncomingRequestCfProperties | undefined);
}
