// Playbook shape. Content files (jp.ts / kr.ts / sg.ts) are TEAM-AUTHORED ONLY
// (AGENTS.md invariant 4): the text is transcribed verbatim from the human's
// QUESTIONS.md Q-3 answer (2026-07-09). The model/agent never edits the market
// content — changes go through the human.

export interface MarketPlaybook {
	market: "jp" | "kr" | "sg";
	marketName: string;
	culturalBuyingProcess: string[];
	buyerPsychology: string[];
	committeeRoleHeuristics: string[];
	messagingJudgment: string[];
	/** One-sentence fallback used if full notes are cut (SPEC.md cut order). */
	fallbackLine: string;
	sources: { title: string; url: string }[];
}
