import type { MarketPlaybook } from "./types";

// TEAM-AUTHORED CONTENT — transcribed verbatim from QUESTIONS.md Q-3
// (human, 2026-07-09). Do not edit without human sign-off (invariant 4).
export const krPlaybook: MarketPlaybook = {
	market: "kr",
	marketName: "Korea",
	culturalBuyingProcess: [
		"Korea is hierarchical, fast-moving once trust exists, and relationship-sensitive. Seniority, title, and department status matter, especially in larger companies and chaebol-style organizations.",
		"Decisions are not always purely top-down. A senior person may have the final say, but the working team still needs to validate fit, implementation effort, risk, and internal usefulness.",
		"Expect visible progress to be ambiguous. Positive meetings may mean interest, not commitment. Internal approval can still depend on senior sponsorship, procurement, legal, IT/security, and business-unit alignment.",
		"Warm introductions, local partners, Korean-language support, and senior-level engagement can materially improve credibility and speed.",
	],
	buyerPsychology: [
		"Korean buyers often prioritize credibility, speed of response, status/signaling, senior-level seriousness, local accountability, and proof that the vendor understands Korea.",
		'A new foreign vendor may trigger concerns such as: "Will they support us locally?", "Will they respond quickly?", "Do they understand Korean business norms?", "Can I defend this choice internally?", and "Are they serious about Korea or just testing the market?"',
		"Risk avoidance is important, but Korea can move faster than Japan when the problem is urgent and the right senior sponsor is engaged.",
		"Price matters, especially in competitive procurement, but credibility, responsiveness, implementation ability, and local seriousness often determine whether the buyer engages deeply.",
	],
	committeeRoleHeuristics: [
		"If the signal contact is Head of Global Partnerships / Strategy / Overseas Business / Business Development, tag them as champion or strategic evaluator.",
		"Enrich the division head / senior director / VP-level business owner as executive sponsor or economic buyer. Senior endorsement matters.",
		"Enrich procurement / purchasing as commercial gatekeeper, especially in large companies.",
		"Enrich IT/security, platform owner, operations lead, or implementation lead as technical evaluator if the product touches systems, data, workflow, AI, infrastructure, or customer operations.",
		"Practical KR heuristic: champion + senior sponsor + procurement or technical evaluator.",
	],
	messagingJudgment: [
		"Do: be respectful, concise, credible, and title-aware.",
		"Do: signal seriousness about Korea: Korean-language materials, local support/partner path, Korean or APAC references, relevant industry proof, and fast response expectations.",
		"Do: make the business value obvious quickly. Korean buyers are often competitive and execution-focused.",
		"Don't: be overly casual, too blunt, or too \"Silicon Valley hype.\" Avoid unsupported disruption language.",
		"Don't: push too hard for a fast decision before trust exists. It can signal that you do not understand the internal decision process.",
		"Don't: bypass hierarchy clumsily. If messaging a senior person, keep it strategic; if messaging an operator, give them internal ammunition.",
	],
	fallbackLine:
		"Korea is hierarchy- and trust-sensitive, so pair the initial champion with a senior sponsor and show local seriousness through Korean-language support, fast responsiveness, and credible references.",
	sources: [
		{
			title: 'Source of Asia, "South Korean Business Culture Guide"',
			url: "https://www.sourceofasia.com/south-korean-business-culture-guide/",
		},
		{
			title: 'Asian Absolute, "A Guide to Business Etiquette in Asia: South Korea"',
			url: "https://asianabsolute.co.uk/blog/a-guide-to-business-etiquette-in-asia-south-korea/",
		},
		{
			title: "KoreaTechDesk, \"In Korea, Progress Doesn't Always Mean Commitment for Global Business\"",
			url: "https://koreatechdesk.com/korea-decision-making-gap-progress-vs-commitment-global-business",
		},
		{
			title: 'CIBTvisas, "A Guide to South Korean Business Etiquette"',
			url: "https://cibtvisas.com/blog/business-etiquette-south-korea",
		},
	],
};
