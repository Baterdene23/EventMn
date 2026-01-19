import Link from "next/link"


export default async function AdminUserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
	const { userId } = await params
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">User</h1>
					<p className="text-sm text-muted-foreground">{userId}</p>
				</div>
				<Link className="text-sm text-muted-foreground hover:underline" href="/admin/users">
					Back
				</Link>
			</div>
			<div className="rounded-2xl border bg-card p-6">
				<p className="text-sm text-muted-foreground">User details placeholder (demo).</p>
			</div>
		</div>
	)
}

