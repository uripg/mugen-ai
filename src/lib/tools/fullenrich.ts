// Server-side FullEnrich v2 client. API surface verified against
// https://docs.fullenrich.com (v2 bulk enrich POST/GET, authentication,
// ratelimit pages) at T-005 implementation time.
// The API key lives only in Worker secrets / .dev.vars and never leaves the
// server (invariant 6); retries are bounded — one retry on 429/5xx, then fail
// (invariant 10). Error messages carry FullEnrich's machine `code` and status
// only — never the key, never payload PII (invariant 9).

const BASE_URL = "https://app.fullenrich.com/api/v2";

export class FullEnrichError extends Error {
	readonly status?: number;
	/** FullEnrich machine-readable error code, e.g. "error.enrichment.in_progress". */
	readonly code?: string;

	constructor(message: string, status?: number, code?: string) {
		super(message);
		this.name = "FullEnrichError";
		this.status = status;
		this.code = code;
	}
}

export async function fullenrichFetch<T>(
	env: Pick<CloudflareEnv, "FULLENRICH_API_KEY">,
	path: string,
	init?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
	if (!env.FULLENRICH_API_KEY) {
		throw new FullEnrichError("FULLENRICH_API_KEY is not configured");
	}

	const attempt = () =>
		fetch(`${BASE_URL}${path}`, {
			method: init?.method ?? "GET",
			headers: {
				Authorization: `Bearer ${env.FULLENRICH_API_KEY}`,
				...(init?.body !== undefined
					? { "Content-Type": "application/json" }
					: {}),
			},
			body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
		});

	let res = await attempt();
	if (res.status === 429 || res.status >= 500) {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		res = await attempt();
	}

	if (!res.ok) {
		// FullEnrich errors: { code: "error.…", message: "…" }. The 400
		// error.enrichment.in_progress case is expected during polling — callers
		// match on `code`. Only the machine `code` + status go into the thrown
		// error: provider messages may echo request PII, and errors get
		// persisted/logged downstream (invariant 9).
		let code: string | undefined;
		try {
			const problem = (await res.json()) as { code?: string };
			code = problem.code;
		} catch {
			// non-JSON error body — status code alone will have to do
		}
		throw new FullEnrichError(
			`FullEnrich ${init?.method ?? "GET"} ${path} failed with ${res.status}${code ? ` (${code})` : ""}`,
			res.status,
			code,
		);
	}

	return res.json() as Promise<T>;
}
