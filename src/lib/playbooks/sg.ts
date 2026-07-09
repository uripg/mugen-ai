import type { MarketPlaybook } from "./types";

// TEAM-AUTHORED CONTENT — transcribed verbatim from QUESTIONS.md Q-3
// (human, 2026-07-09). Do not edit without human sign-off (invariant 4).
export const sgPlaybook: MarketPlaybook = {
	market: "sg",
	marketName: "Singapore",
	culturalBuyingProcess: [
		"Singapore is generally structured, pragmatic, English-friendly, procurement-aware, and ROI/risk-driven.",
		"Compared with Japan and Korea, foreign vendors usually face less language friction, but buyers still expect strong business justification, clear implementation details, and professional follow-through.",
		"In enterprise deals, expect a buying committee: business owner, finance/procurement, IT/security, legal/compliance, and sometimes an executive sponsor.",
		"Government, government-linked, financial, and regulated buyers are especially process-driven. Singapore public procurement emphasizes fairness, openness, competitiveness, transparency, integrity, and value for money.",
		"APAC B2B buying is committee-heavy. Forrester's APAC data reports a median of eight people involved in B2B purchase decisions, with many firms involving 10+ people and multiple departments.",
	],
	buyerPsychology: [
		"Singapore buyers prioritize business value, ROI, reliability, compliance, security, implementation speed, professionalism, and regional credibility.",
		"A new foreign vendor is acceptable if the business case is clear and the vendor can prove supportability, security, and execution quality.",
		'Common concerns: "Can they support Singapore/APAC?", "Will this pass procurement/security?", "Can they integrate cleanly?", "Is the ROI measurable?", and "Will implementation create operational risk?"',
		"Buyers can be more direct than in Japan/Korea, but trust, reputation, and relationship quality still matter.",
	],
	committeeRoleHeuristics: [
		"If the signal contact is Head of Global Partnerships / Regional Strategy / APAC Growth / Business Development, tag them as champion or strategic evaluator.",
		"Enrich the business unit owner / regional GM / functional VP as economic buyer or executive sponsor.",
		"Enrich procurement / finance as commercial evaluator, especially for enterprise, government-linked, or formal RFP environments.",
		"Enrich IT/security/compliance as technical evaluator, especially for SaaS, AI, fintech, HR, procurement, data, or infrastructure products.",
		"Practical SG heuristic: champion + business owner + procurement/IT-security.",
	],
	messagingJudgment: [
		"Do: be concise, polished, direct, and business-case-first.",
		"Do: lead with relevance, measurable value, Singapore/APAC fit, proof points, security/compliance posture, and implementation clarity.",
		"Do: include regional references, named customers if allowed, ROI evidence, and a clear next step.",
		"Don't: overdo ceremony or vague relationship-building. Singapore buyers usually tolerate direct commercial messaging better than Japan/Korea.",
		"Don't: make unsupported claims about compliance, government readiness, AI safety, data residency, cost savings, or local presence.",
		"Don't: hide support limitations. If support is regional or remote, explain the support model clearly.",
	],
	fallbackLine:
		"Singapore is pragmatic and procurement-aware, so pair the champion with the business owner and procurement/IT evaluator, then lead with ROI, credibility, compliance, and implementation clarity.",
	sources: [
		{
			title: 'Singapore GeBIZ, "Guide to Singapore Procurement"',
			url: "https://www.gebiz.gov.sg/singapore-government-procurement-regime.html",
		},
		{
			title: 'Singapore Ministry of Finance, "Government Procurement"',
			url: "https://www.mof.gov.sg/policies/government-procurement/overview/",
		},
		{
			title: 'Forrester, "The Complexity Of The B2B Buying Process In Asia Pacific"',
			url: "https://www.forrester.com/report/the-complexity-of-the-b2b-buying-process-in-asia-pacific/RES181577",
		},
		{
			title: 'Forrester, "The State Of Business Buying, 2024"',
			url: "https://www.forrester.com/press-newsroom/forrester-the-state-of-business-buying-2024/",
		},
	],
};
