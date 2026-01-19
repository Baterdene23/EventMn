import Link from "next/link"

export default function AdminHomePage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
				<p className="text-sm text-muted-foreground">Системийн удирдлагын хэсэг (demo).</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Link className="rounded-2xl border bg-card p-5 hover:bg-accent/30" href="/admin/events">
					<div className="text-sm font-medium">Events</div>
					<div className="mt-1 text-sm text-muted-foreground">Нийт эвентүүд</div>
				</Link>
				<Link className="rounded-2xl border bg-card p-5 hover:bg-accent/30" href="/admin/users">
					<div className="text-sm font-medium">Users</div>
					<div className="mt-1 text-sm text-muted-foreground">Хэрэглэгчид</div>
				</Link>
				<Link className="rounded-2xl border bg-card p-5 hover:bg-accent/30" href="/admin/reports">
					<div className="text-sm font-medium">Reports</div>
					<div className="mt-1 text-sm text-muted-foreground">Тайлангууд</div>
				</Link>
			</div>
		</div>
	)
}

