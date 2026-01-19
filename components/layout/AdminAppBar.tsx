import Link from "next/link"

export function AdminAppBar() {
	return (
		<header className="border-b bg-card">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<Link href="/" className="text-sm font-semibold">
					EventMN
				</Link>
				<nav className="flex items-center gap-4 text-sm text-muted-foreground">
					<Link className="hover:text-foreground" href="/admin">
						Admin
					</Link>
					<Link className="hover:text-foreground" href="/admin/events">
						Events
					</Link>
					<Link className="hover:text-foreground" href="/admin/users">
						Users
					</Link>
					<Link className="hover:text-foreground" href="/admin/reports">
						Reports
					</Link>
				</nav>
			</div>
		</header>
	)
}
