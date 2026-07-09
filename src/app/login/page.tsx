"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const { error } = await authClient.signIn.email({ email, password });
		if (error) {
			setError(error.message ?? "Sign-in failed");
			setBusy(false);
			return;
		}
		router.push("/");
		router.refresh();
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
			<form
				onSubmit={onSubmit}
				className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
			>
				<div>
					<h1 className="text-xl font-semibold text-zinc-50">mugen</h1>
					<p className="mt-1 text-sm text-zinc-400">
						Team sign-in — APAC expansion copilot
					</p>
				</div>
				<input
					type="email"
					required
					autoComplete="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-400"
				/>
				<input
					type="password"
					required
					autoComplete="current-password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-400"
				/>
				{error && <p className="text-sm text-red-400">{error}</p>}
				<button
					type="submit"
					disabled={busy}
					className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
				>
					{busy ? "Signing in…" : "Sign in"}
				</button>
			</form>
		</main>
	);
}
