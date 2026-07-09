"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Everything renders from the polled /api/leads payload — all state lives in
// D1, so a hard refresh loses nothing.

type Run = {
	id: string;
	stage: string;
	status: "running" | "done" | "failed";
	error: string | null;
	startedAt: number | string | null;
};

type CommitteeContact = {
	id: string;
	name: string;
	title: string | null;
	verified: boolean;
	committeeRole: string | null;
};

type Intel = {
	id: string;
	kind:
		| "cultural-note"
		| "psychology-note"
		| "competitor-note"
		| "repositioned-value-prop";
	content: string;
	playbookKey: string | null;
	createdAt: number | string;
	citations?: string[];
};

type Draft = {
	id: string;
	version: number;
	body: string;
	editedBody: string | null;
	createdAt: number | string;
};

type Lead = {
	id: string;
	stage: string;
	status: "draft" | "edited" | "approved" | "sent-simulated";
	score: number | null;
	scoreReasoning: string | null;
	stageDetail: { reason?: string } | null;
	signal: {
		type: string;
		summary: string;
		detectedAt: number | string | null;
	} | null;
	primaryContact: {
		name: string;
		title: string | null;
		verified: boolean;
		committeeRole: string | null;
	} | null;
	committee: CommitteeContact[];
	dealIntel: Intel[];
	drafts: Draft[];
};

type Account = {
	id: string;
	name: string;
	market: "jp" | "kr" | "sg";
	domain: string | null;
	runs: Run[];
	leads: Lead[];
};

const MARKETS = [
	{ key: "jp", label: "Japan" },
	{ key: "kr", label: "Korea" },
	{ key: "sg", label: "Singapore" },
] as const;

const STAGE_LABEL: Record<string, string> = {
	signal: "signal",
	contact: "contact",
	"no-contact": "no verified contact",
	intel: "intel",
	scored: "scored",
	drafted: "drafted",
	failed: "failed",
};

export function Dashboard() {
	const [accounts, setAccounts] = useState<Account[] | null>(null);
	const inFlight = useRef(false);

	const refresh = useCallback(async () => {
		if (inFlight.current) return; // ignore overlapping polls
		inFlight.current = true;
		try {
			const res = await fetch("/api/leads");
			if (res.ok) {
				const data = (await res.json()) as { accounts: Account[] };
				setAccounts(data.accounts);
			}
		} catch {
			// transient poll failure — next tick retries
		} finally {
			inFlight.current = false;
		}
	}, []);

	useEffect(() => {
		const t0 = setTimeout(() => void refresh(), 0);
		const t = setInterval(() => void refresh(), 3000);
		return () => {
			clearTimeout(t0);
			clearInterval(t);
		};
	}, [refresh]);

	if (accounts === null) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}

	return (
		<Tabs defaultValue="jp">
			<TabsList>
				{MARKETS.map((m) => (
					<TabsTrigger key={m.key} value={m.key}>
						{m.label} ({accounts.filter((a) => a.market === m.key).length})
					</TabsTrigger>
				))}
			</TabsList>
			{MARKETS.map((m) => {
				const marketAccounts = accounts.filter((a) => a.market === m.key);
				return (
					<TabsContent key={m.key} value={m.key} className="space-y-4">
						{marketAccounts.length === 0 && (
							<p className="text-sm text-muted-foreground">
								No target accounts in {m.label}.
							</p>
						)}
						{marketAccounts.map((account) => (
							<AccountCard
								key={account.id}
								account={account}
								onChanged={refresh}
							/>
						))}
					</TabsContent>
				);
			})}
		</Tabs>
	);
}

function AccountCard({
	account,
	onChanged,
}: {
	account: Account;
	onChanged: () => void;
}) {
	const latestRun = account.runs[0];
	const running = latestRun?.status === "running";

	const runPipeline = () => {
		// Response is an NDJSON stream — fire-and-forget; polling shows progress.
		fetch("/api/pipeline/run", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ accountId: account.id }),
		}).catch(() => {});
		setTimeout(onChanged, 500);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<CardTitle className="text-base">{account.name}</CardTitle>
					<Badge variant="outline" className="uppercase">
						{account.market}
					</Badge>
					{account.domain && (
						<span className="text-xs text-muted-foreground">
							{account.domain}
						</span>
					)}
					{latestRun && (
						<Badge
							variant={
								latestRun.status === "failed"
									? "destructive"
									: latestRun.status === "running"
										? "default"
										: "secondary"
							}
						>
							run: {latestRun.stage} · {latestRun.status}
						</Badge>
					)}
					{latestRun?.error && (
						<span className="text-xs text-destructive">{latestRun.error}</span>
					)}
				</div>
				<Button size="sm" onClick={runPipeline} disabled={running}>
					{running ? "Running…" : "Run pipeline"}
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				{account.leads.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No leads yet — run the pipeline.
					</p>
				) : (
					account.leads.map((lead) => (
						<LeadCard key={lead.id} lead={lead} onChanged={onChanged} />
					))
				)}
			</CardContent>
		</Card>
	);
}

function statusVariant(status: Lead["status"]) {
	switch (status) {
		case "sent-simulated":
			return "default" as const;
		case "approved":
			return "secondary" as const;
		default:
			return "outline" as const;
	}
}

function LeadCard({ lead, onChanged }: { lead: Lead; onChanged: () => void }) {
	const [busy, setBusy] = useState(false);
	const latestDraft = lead.drafts[0];
	const displayBody = latestDraft
		? (latestDraft.editedBody ?? latestDraft.body)
		: null;

	const post = async (path: string, body?: unknown) => {
		setBusy(true);
		try {
			await fetch(`/api/leads/${lead.id}/${path}`, {
				method: "POST",
				...(body !== undefined
					? {
							headers: { "content-type": "application/json" },
							body: JSON.stringify(body),
						}
					: {}),
			});
		} catch {
			// polling reconciles
		} finally {
			setBusy(false);
			onChanged();
		}
	};

	const canApprove = lead.status === "draft" || lead.status === "edited";
	const canMarkSent = lead.status === "approved";
	const canEdit = lead.status !== "sent-simulated" && latestDraft != null;

	return (
		<div className="rounded-lg border p-4 space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				{lead.signal && (
					<Badge variant="secondary">{lead.signal.type}</Badge>
				)}
				<Badge
					variant={lead.stage === "failed" ? "destructive" : "outline"}
				>
					{STAGE_LABEL[lead.stage] ?? lead.stage}
				</Badge>
				<Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
				<div className="ml-auto">
					<WhyPanel lead={lead} />
				</div>
			</div>

			{lead.signal && <p className="text-sm">{lead.signal.summary}</p>}

			{lead.stage === "no-contact" && (
				<p className="text-sm text-muted-foreground">
					No verified contact
					{lead.stageDetail?.reason ? ` — ${lead.stageDetail.reason}` : ""}
				</p>
			)}

			{lead.primaryContact && (
				<div className="flex flex-wrap items-center gap-2 text-sm">
					<span className="font-medium">{lead.primaryContact.name}</span>
					{lead.primaryContact.title && (
						<span className="text-muted-foreground">
							{lead.primaryContact.title}
						</span>
					)}
					{lead.primaryContact.verified && (
						<Badge variant="secondary">verified</Badge>
					)}
					{lead.primaryContact.committeeRole && (
						<Badge variant="outline">
							{lead.primaryContact.committeeRole}
						</Badge>
					)}
				</div>
			)}

			{/* Invariant 3: score renders as ONE element with its reasoning — never a bare number. */}
			{lead.score !== null && lead.scoreReasoning && (
				<div className="rounded-md bg-muted p-3">
					<p className="text-sm font-semibold">Readiness score: {lead.score}/100</p>
					<p className="text-xs text-muted-foreground">
						{lead.scoreReasoning}
					</p>
				</div>
			)}

			{displayBody && latestDraft && (
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-muted-foreground">
							Draft v{latestDraft.version}
							{latestDraft.editedBody ? " (edited)" : ""}
						</span>
					</div>
					<pre className="whitespace-pre-wrap rounded-md border p-3 text-sm font-sans">
						{displayBody}
					</pre>
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				<Button
					size="sm"
					disabled={busy || !canApprove}
					onClick={() => post("approve", { to: "approved" })}
				>
					Approve
				</Button>
				<Button
					size="sm"
					variant="secondary"
					disabled={busy || !canMarkSent}
					onClick={() => post("approve", { to: "sent-simulated" })}
				>
					Mark sent (simulated)
				</Button>
				{latestDraft && (
					<EditDialog
						disabled={busy || !canEdit}
						initialBody={displayBody ?? ""}
						onSave={(body) => post("edit", { body })}
					/>
				)}
				<Button
					size="sm"
					variant="outline"
					disabled={busy || lead.status === "sent-simulated"}
					onClick={() => post("regenerate")}
				>
					Regenerate
				</Button>
			</div>
		</div>
	);
}

function EditDialog({
	disabled,
	initialBody,
	onSave,
}: {
	disabled: boolean;
	initialBody: string;
	onSave: (body: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState(initialBody);

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) setValue(initialBody);
			}}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" disabled={disabled}>
					Edit
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit draft</DialogTitle>
				</DialogHeader>
				<Textarea
					value={value}
					onChange={(e) => setValue(e.target.value)}
					rows={14}
					className="max-h-[60vh]"
				/>
				<DialogFooter>
					<Button
						disabled={value.trim().length === 0}
						onClick={() => {
							onSave(value);
							setOpen(false);
						}}
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Why-panel: the six grounded elements, each labeled with its source
// (invariant 2 provenance). Missing pieces are explicit honest empties.
function WhyPanel({ lead }: { lead: Lead }) {
	const intel = (kind: Intel["kind"]) =>
		lead.dealIntel.find((i) => i.kind === kind);
	const cultural = intel("cultural-note");
	const psychology = intel("psychology-note");
	const competitor = intel("competitor-note");

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button size="sm" variant="ghost">
					Why?
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Why this lead</SheetTitle>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-6rem)] pr-4">
					<div className="space-y-4 px-4 pb-8 text-sm">
						<WhySection label="Signal" source="Sillage">
							{lead.signal ? (
								<>
									<Badge variant="secondary" className="mb-1">
										{lead.signal.type}
									</Badge>
									<p>{lead.signal.summary}</p>
								</>
							) : (
								<p className="text-muted-foreground">not found</p>
							)}
						</WhySection>
						<Separator />
						<WhySection label="Buying committee" source="FullEnrich">
							{lead.committee.length > 0 ? (
								<ul className="space-y-1">
									{lead.committee.map((c) => (
										<li key={c.id} className="flex flex-wrap items-center gap-1.5">
											<span className="font-medium">{c.name}</span>
											{c.title && (
												<span className="text-muted-foreground">
													{c.title}
												</span>
											)}
											{c.committeeRole && (
												<Badge variant="outline">{c.committeeRole}</Badge>
											)}
											{c.verified && (
												<Badge variant="secondary">verified</Badge>
											)}
										</li>
									))}
								</ul>
							) : (
								<p className="text-muted-foreground">not found</p>
							)}
						</WhySection>
						<Separator />
						<WhySection
							label="Cultural note"
							source={
								cultural?.playbookKey
									? `playbook: ${cultural.playbookKey}`
									: "playbook"
							}
						>
							{cultural ? (
								<p>{cultural.content}</p>
							) : (
								<p className="text-muted-foreground">not found</p>
							)}
						</WhySection>
						<Separator />
						<WhySection
							label="Psychology note"
							source={
								psychology?.playbookKey
									? `playbook: ${psychology.playbookKey}`
									: "playbook"
							}
						>
							{psychology ? (
								<p>{psychology.content}</p>
							) : (
								<p className="text-muted-foreground">not found</p>
							)}
						</WhySection>
						<Separator />
						<WhySection label="Competitor note" source="research_market">
							{competitor ? (
								<>
									<p>{competitor.content}</p>
									{competitor.citations &&
										competitor.citations.length > 0 && (
											<ul className="mt-1 space-y-0.5 text-xs text-muted-foreground break-all">
												{competitor.citations.map((c) => (
													<li key={c}>{c}</li>
												))}
											</ul>
										)}
								</>
							) : (
								<p className="text-muted-foreground">none verified</p>
							)}
						</WhySection>
						<Separator />
						<WhySection label="Score reasoning" source="scoring">
							{lead.score !== null && lead.scoreReasoning ? (
								<>
									{/* Invariant 3: score never separated from reasoning. */}
									<p className="font-semibold">{lead.score}/100</p>
									<p>{lead.scoreReasoning}</p>
								</>
							) : (
								<p className="text-muted-foreground">not scored yet</p>
							)}
						</WhySection>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

function WhySection({
	label,
	source,
	children,
}: {
	label: string;
	source: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="mb-1 flex items-center justify-between gap-2">
				<h3 className="font-semibold">{label}</h3>
				<span className="text-xs text-muted-foreground">{source}</span>
			</div>
			{children}
		</section>
	);
}
