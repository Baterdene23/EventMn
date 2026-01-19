import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { Calendar, MapPin, Users, Heart, User } from "lucide-react"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/Badge"
import { AdminEventActions } from "@/components/admin/AdminEventActions"

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

export default async function AdminEventDetailsPage({
	params,
}: {
	params: Promise<{ eventId: string }>
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

	const { eventId } = await params

	// Get event with full details
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		include: {
			owner: {
				select: { id: true, name: true, email: true, avatarUrl: true },
			},
			_count: {
				select: { attendees: true, likes: true },
			},
		},
	})

	if (!event) notFound()

	// Get attendees list
	const attendees = await prisma.attendee.findMany({
		where: { eventId },
		include: {
			user: {
				select: { id: true, name: true, email: true },
			},
		},
		take: 10,
	})

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
						<Badge className={STATUS_STYLES[event.status]}>
							{STATUS_LABELS[event.status]}
						</Badge>
					</div>
					<p className="mt-1 text-sm text-muted-foreground">
						{event.date} • {event.city} • {event.category}
					</p>
				</div>
				<Link className="text-sm text-muted-foreground hover:underline shrink-0" href="/admin/events">
					Буцах
				</Link>
			</div>

			{/* Actions */}
			<div className="rounded-2xl border bg-card p-5">
				<h2 className="text-lg font-semibold mb-4">Үйлдлүүд</h2>
				<AdminEventActions
					eventId={event.id}
					currentStatus={event.status}
				/>
			</div>

			{/* Event Details */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Info */}
				<div className="lg:col-span-2 space-y-6">
					{/* Cover Image */}
					{event.imageSrc && (
						<div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-muted">
							<Image
								src={event.imageSrc}
								alt={event.title}
								fill
								className="object-cover"
							/>
						</div>
					)}

					{/* Description */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Тайлбар</h2>
						<p className="mt-2 text-muted-foreground">
							{event.description || event.excerpt || "Тайлбар оруулаагүй байна."}
						</p>
					</div>

					{/* Attendees */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Оролцогчид ({event._count.attendees})</h2>
						{attendees.length === 0 ? (
							<p className="mt-2 text-sm text-muted-foreground">Одоогоор оролцогч байхгүй байна.</p>
						) : (
							<div className="mt-4 divide-y">
								{attendees.map((attendee) => (
									<div key={attendee.id} className="flex items-center gap-3 py-2">
										<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
											<User className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<div className="text-sm font-medium">{attendee.user.name || "Нэргүй"}</div>
											<div className="text-xs text-muted-foreground">{attendee.user.email}</div>
										</div>
									</div>
								))}
								{event._count.attendees > 10 && (
									<p className="pt-2 text-sm text-muted-foreground">
										+{event._count.attendees - 10} бусад оролцогч
									</p>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Stats */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Статистик</h2>
						<div className="mt-4 space-y-3">
							<div className="flex items-center gap-3">
								<Users className="h-5 w-5 text-muted-foreground" />
								<span>{event._count.attendees} оролцогч</span>
							</div>
							<div className="flex items-center gap-3">
								<Heart className="h-5 w-5 text-muted-foreground" />
								<span>{event._count.likes} хадгалсан</span>
							</div>
							<div className="flex items-center gap-3">
								<Calendar className="h-5 w-5 text-muted-foreground" />
								<span>{event.date}</span>
							</div>
							<div className="flex items-center gap-3">
								<MapPin className="h-5 w-5 text-muted-foreground" />
								<span>{event.location || event.city}</span>
							</div>
						</div>
					</div>

					{/* Owner */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Зохион байгуулагч</h2>
						<div className="mt-4 flex items-center gap-3">
							<div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
								{event.owner.avatarUrl ? (
									<Image
										src={event.owner.avatarUrl}
										alt={event.owner.name || "Owner"}
										width={48}
										height={48}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
										{event.owner.name?.charAt(0)?.toUpperCase() || event.owner.email?.charAt(0)?.toUpperCase() || "?"}
									</div>
								)}
							</div>
							<div>
								<div className="font-medium">{event.owner.name || "Нэргүй"}</div>
								<div className="text-sm text-muted-foreground">{event.owner.email}</div>
							</div>
						</div>
						<Link
							href={`/admin/users/${event.owner.id}`}
							className="mt-3 block text-sm text-primary hover:underline"
						>
							Хэрэглэгчийн дэлгэрэнгүй
						</Link>
					</div>

					{/* Event Link */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Холбоосууд</h2>
						<div className="mt-3 space-y-2 text-sm">
							<Link
								href={`/events/${event.id}`}
								className="block text-primary hover:underline"
								target="_blank"
							>
								Нийтийн хуудас үзэх
							</Link>
						</div>
					</div>

					{/* Pricing */}
					<div className="rounded-2xl border bg-card p-5">
						<h2 className="text-lg font-semibold">Үнэ</h2>
						<div className="mt-2 text-2xl font-bold">
							{event.price === 0 ? "Үнэгүй" : `${event.price.toLocaleString()}₮`}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
