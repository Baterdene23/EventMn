import Link from "next/link"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/Badge"

// Status badge colors
const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
	COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Ноорог",
	PUBLISHED: "Нийтлэгдсэн",
	CANCELLED: "Цуцлагдсан",
	COMPLETED: "Дууссан",
}

export default async function AdminEventsPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>
}) {
	const session = await getSession()
	if (!session) {
		redirect("/login?returnTo=/admin/events")
	}

	// Check if user is admin
	const user = await prisma.user.findUnique({
		where: { id: session.userId },
		select: { role: true },
	})

	if (user?.role !== "ADMIN") {
		redirect("/dashboard")
	}

	const { status } = await searchParams
	const statusFilter = status as "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | undefined

	// Get all events with owner info
	const events = await prisma.event.findMany({
		where: statusFilter ? { status: statusFilter } : undefined,
		include: {
			owner: {
				select: { id: true, name: true, email: true },
			},
			_count: {
				select: { attendees: true, likes: true },
			},
		},
		orderBy: { publishedAt: "desc" },
	})

	// Get counts for each status
	const [draftCount, publishedCount, cancelledCount, completedCount] = await Promise.all([
		prisma.event.count({ where: { status: "DRAFT" } }),
		prisma.event.count({ where: { status: "PUBLISHED" } }),
		prisma.event.count({ where: { status: "CANCELLED" } }),
		prisma.event.count({ where: { status: "COMPLETED" } }),
	])

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Эвент удирдлага</h1>
				<p className="text-sm text-muted-foreground">Бүх эвентүүдийг удирдах, зөвшөөрөх, устгах.</p>
			</div>

			{/* Status Filter Tabs */}
			<div className="flex flex-wrap gap-2">
				<Link
					href="/admin/events"
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						!statusFilter
							? "bg-primary text-primary-foreground"
							: "bg-muted hover:bg-accent"
					}`}
				>
					Бүгд ({draftCount + publishedCount + cancelledCount + completedCount})
				</Link>
				<Link
					href="/admin/events?status=DRAFT"
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						statusFilter === "DRAFT"
							? "bg-yellow-500 text-white"
							: "bg-muted hover:bg-accent"
					}`}
				>
					Ноорог ({draftCount})
				</Link>
				<Link
					href="/admin/events?status=PUBLISHED"
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						statusFilter === "PUBLISHED"
							? "bg-green-500 text-white"
							: "bg-muted hover:bg-accent"
					}`}
				>
					Нийтлэгдсэн ({publishedCount})
				</Link>
				<Link
					href="/admin/events?status=CANCELLED"
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						statusFilter === "CANCELLED"
							? "bg-red-500 text-white"
							: "bg-muted hover:bg-accent"
					}`}
				>
					Цуцлагдсан ({cancelledCount})
				</Link>
				<Link
					href="/admin/events?status=COMPLETED"
					className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
						statusFilter === "COMPLETED"
							? "bg-gray-500 text-white"
							: "bg-muted hover:bg-accent"
					}`}
				>
					Дууссан ({completedCount})
				</Link>
			</div>

			{/* Events List */}
			{events.length === 0 ? (
				<div className="rounded-2xl border bg-card p-8 text-center">
					<p className="text-muted-foreground">
						{statusFilter ? `${STATUS_LABELS[statusFilter]} төлөвтэй эвент байхгүй байна.` : "Эвент байхгүй байна."}
					</p>
				</div>
			) : (
				<div className="divide-y overflow-hidden rounded-2xl border bg-card">
					{events.map((event) => (
						<Link
							key={event.id}
							href={`/admin/events/${event.id}`}
							className="block px-5 py-4 hover:bg-accent/30 transition-colors"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium truncate">{event.title}</span>
										<Badge className={STATUS_STYLES[event.status]}>
											{STATUS_LABELS[event.status]}
										</Badge>
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										{event.date} • {event.city} • {event.category}
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										Зохион байгуулагч: {event.owner.name || event.owner.email}
									</div>
								</div>
								<div className="text-right text-sm text-muted-foreground shrink-0">
									<div>{event._count.attendees} оролцогч</div>
									<div>{event._count.likes} хадгалсан</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
