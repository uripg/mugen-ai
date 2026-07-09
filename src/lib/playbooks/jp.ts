import type { MarketPlaybook } from "./types";

// TEAM-AUTHORED CONTENT — transcribed verbatim from QUESTIONS.md Q-3
// (human, 2026-07-09). Do not edit without human sign-off (invariant 4).
export const jpPlaybook: MarketPlaybook = {
	market: "jp",
	marketName: "Japan",
	culturalBuyingProcess: [
		"Japan is highly consensus-driven. Purchase decisions often move through informal pre-alignment (nemawashi) before a formal approval route such as ringi/ringisho, where a proposal circulates across multiple stakeholders for sign-off.",
		"Do not assume the person who likes the product can buy alone. The internal path often includes the business champion, the department head, IT/security, procurement, legal, finance, and sometimes a senior executive sponsor.",
		"Enterprise sales cycles can be long. Recent Japan B2B sales guidance describes formal approval chains involving roughly 5–12 stakeholders and enterprise deal cycles often taking 6–18 months.",
		"Documentation matters. Buyers often need clear written material they can forward internally: business case, implementation plan, security notes, pricing, references, support model, and risk mitigation.",
	],
	buyerPsychology: [
		"Japanese buyers tend to prioritize risk reduction, reliability, stability, references, local support, and long-term vendor commitment.",
		"A new foreign vendor may be viewed as risky until it proves it understands the Japanese market, can support implementation properly, and will not disappear after the sale.",
		"Localization matters: Japanese-language collateral, Japanese support paths, local partner coverage, and Japan/APAC references all reduce perceived risk.",
		'Price matters, but usually after the vendor is considered safe. "Reliable and proven" usually beats "cheap but uncertain."',
	],
	committeeRoleHeuristics: [
		"If the signal contact is Head of Global Partnerships / Business Development / Strategy, tag them as champion or market-entry scout.",
		"Enrich the department head / bucho-level owner as economic buyer or executive sponsor, because budget and internal credibility often sit above the first contact.",
		"Enrich IT/security, operations, systems owner, or implementation lead as technical evaluator, especially for SaaS, AI, workflow, integrations, data, or compliance products.",
		"Practical JP heuristic: champion + bucho/economic buyer + technical evaluator. Champion-only enrichment is usually too thin.",
	],
	messagingJudgment: [
		"Do: use a formal, precise, humble, evidence-led tone.",
		"Do: open with why this account/person is relevant, then ask for a low-pressure conversation or feedback.",
		"Do: include proof points: references, security posture, implementation support, localization, Japanese-language materials, and long-term commitment.",
		"Do: make the message easy to forward internally.",
		"Don't: overclaim, use aggressive urgency, imply they should decide quickly, or position the product as obviously superior to local alternatives.",
		"Don't: treat silence as disinterest too quickly. The process may be moving internally without visible momentum.",
	],
	fallbackLine:
		"Japan is consensus-led and risk-sensitive, so pair the initial champion with the budget-owning department head and lead with trust, localization, references, and implementation safety.",
	sources: [
		{
			title: 'Mind Melt, "Japan B2B Sales Strategy for Foreign Companies"',
			url: "https://mindmelt.jp/insights/japan-b2b-sales-strategy",
		},
		{
			title: 'Silkdrive, "Ringi: The Japanese Approval Process European Sales Teams Keep Misreading"',
			url: "https://www.silkdrive.com/insights/ringi-japanese-approval-process",
		},
		{
			title: 'Nihonium, "Japanese B2B Sales: Key Differences from Western Markets"',
			url: "https://nihonium.io/japanese-b2b-sales-key-differences-from-western-markets/",
		},
		{
			title: 'Litmus, "Why Partnerships Drive B2B Sales Growth in Japan"',
			url: "https://www.litmus-jp.com/thought-starters/why-partnerships-drive-b2b-sales-growth-in-japan",
		},
	],
};
