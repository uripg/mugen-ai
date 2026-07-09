// Server-side Sillage V2 client. API surface verified against SILLAGE_API.md
// (in-repo copy of the official Sillage Public API doc, v1.0.0).
// The API key lives only in Worker secrets / .dev.vars and never leaves the
// server (invariant 6); retries are bounded — one retry on 429/5xx, then fail
// (invariant 10).

const BASE_URL = "https://api.getsillage.com/api";

export class SillageError extends Error {
	readonly status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.name = "SillageError";
		this.status = status;
	}
}

export async function sillageFetch<T>(
	env: Pick<CloudflareEnv, "SILLAGE_API_KEY">,
	path: string,
	init?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
	if (!env.SILLAGE_API_KEY) {
		throw new SillageError("SILLAGE_API_KEY is not configured");
	}

	const attempt = () =>
		fetch(`${BASE_URL}${path}`, {
			method: init?.method ?? "GET",
			headers: {
				Authorization: `Bearer ${env.SILLAGE_API_KEY}`,
				...(init?.body !== undefined
					? { "Content-Type": "application/json" }
					: {}),
			},
			body:
				init?.body !== undefined ? JSON.stringify(init.body) : undefined,
		});

	let res = await attempt();
	if (res.status === 429 || res.status >= 500) {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		res = await attempt();
	}

	if (!res.ok) {
		// v2 errors are RFC 9457 problem documents; v1 uses { error: { message } }.
		// Surface the human-readable part only — never the key, never payload PII.
		let detail = "";
		try {
			const problem = (await res.json()) as {
				title?: string;
				detail?: string;
				error?: { message?: string };
			};
			detail =
				problem.detail ?? problem.title ?? problem.error?.message ?? "";
		} catch {
			// non-JSON error body — status code alone will have to do
		}
		throw new SillageError(
			`Sillage ${init?.method ?? "GET"} ${path} failed with ${res.status}${detail ? `: ${detail}` : ""}`,
			res.status,
		);
	}

	return res.json() as Promise<T>;
}
