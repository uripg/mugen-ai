// @better-auth/cli schema-generation entrypoint ONLY — never imported by app
// code. The runtime creates its instance per-request via initAuth() (T-002
// reviewer finding: no module-scope instance in the runtime path).
import { createAuth } from "./index";

export const auth = createAuth();
