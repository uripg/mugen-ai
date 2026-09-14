import { createAuthClient } from "better-auth/client";
import { cloudflareClient } from "better-auth-cloudflare/client";

export const authClient = createAuthClient({
	plugins: [cloudflareClient()],
});
