import Link from "next/link"

const users = [
	{ id: "usr_001", name: "Baterdene", role: "Organizer" },
	{ id: "usr_101", name: "Admin Demo", role: "Admin" },
]

export default function AdminUsersPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Admin • Users</h1>
				<p className="text-sm text-muted-foreground">Хэрэглэгчдийн жагсаалт (demo).</p>
			</div>

			<div className="divide-y overflow-hidden rounded-2xl border bg-card">
				{users.map((user) => (
					<Link key={user.id} href={`/admin/users/${user.id}`} className="block px-5 py-4 hover:bg-accent/30">
						<div className="font-medium">{user.name}</div>
						<div className="mt-1 text-sm text-muted-foreground">{user.role}</div>
					</Link>
				))}
			</div>
		</div>
	)
}

