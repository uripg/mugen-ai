import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextCoreWebVitals,
	...nextTypescript,
	globalIgnores([".open-next/**", ".next/**", "cloudflare-env.d.ts"]),
]);

export default eslintConfig;
