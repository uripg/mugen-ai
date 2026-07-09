import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { initAuth } from "./index";

// Server-side session check (AGENTS.md invariant 7): every page/route that isn't
// the auth handler or /login must call one of these.
export async function getSession() {
	const auth = await initAuth();
	return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
	const session = await getSession();
	if (!session) redirect("/login");
	return session;
}
