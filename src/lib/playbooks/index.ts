import type { MarketPlaybook } from "./types";
import { jpPlaybook } from "./jp";
import { krPlaybook } from "./kr";
import { sgPlaybook } from "./sg";

export type { MarketPlaybook };

export const playbooks: Record<"jp" | "kr" | "sg", MarketPlaybook> = {
	jp: jpPlaybook,
	kr: krPlaybook,
	sg: sgPlaybook,
};
