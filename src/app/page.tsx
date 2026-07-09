import { requireSession } from "@/lib/auth/session";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const session = await requireSession();

	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="flex items-center justify-between border-b px-6 py-4">
				<div>
					<h1 className="text-lg font-semibold">mugen</h1>
					<p className="text-xs text-muted-foreground">
						APAC expansion copilot — Japan · Korea · Singapore
					</p>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs text-muted-foreground">
						{session.user.email}
					</span>
					<SignOutButton />
				</div>
			</header>
			<section className="p-6">
				<p className="text-sm text-muted-foreground">
					Dashboard shell (T-002). Lead cards arrive with the pipeline
					tickets.
				</p>
			</section>
		</main>
	);
}
