import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Pencil, Settings, Mail, Calendar, MapPin, Heart } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { EventCard } from "@/components/events/EventCard"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { CATEGORIES } from "@/lib/data/categories"

import {
	getDashboardCreatedEvents,
	getDashboardParticipatingEvents,
	getRecommendedEventsByUserInterests,
} from "@/lib/data/events"
import { getLikedEventIds } from "@/lib/data/likes"

// Role display names
const ROLE_LABELS: Record<string, string> = {
	USER: "Хэрэглэгч",
	ORGANIZER: "Зохион байгуулагч",
	ADMIN: "Админ",
}

export default async function DashboardPage() {
	const session = await getSession()
	if (!session) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Хэрэглэгчийн самбар</h1>
				<p className="text-muted-foreground">
					<Link href="/login?returnTo=/dashboard" className="underline">Нэвтрэх</Link> шаардлагатай.
				</p>
			</div>
		)
	}

	// Redirect admin users to admin dashboard
	if (session.userRole === "ADMIN") {
		redirect("/admin")
	}

	const userId = session.userId
	

	// Fetch user profile and all dashboard data in parallel
	const [user, likedIds, createdEvents, participatingEvents, recommendedEvents] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
				role: true,
				interests: true,
			},
		}),
		getLikedEventIds(userId),
		getDashboardCreatedEvents(userId),
		getDashboardParticipatingEvents(userId),
		getRecommendedEventsByUserInterests(userId),
	])

	if (!user) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Хэрэглэгчийн самбар</h1>
				<p className="text-muted-foreground">Хэрэглэгч олдсонгүй.</p>
			</div>
		)
	}

	const likedSet = new Set(likedIds)

	return (
		<div className="space-y-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-semibold tracking-tight">Хэрэглэгчийн самбар</h1>
					<p className="text-sm text-muted-foreground">
						Тавтай морилно уу, <b>{user.name || "Хэрэглэгч"}</b>! Энд тантай холбоотой мэдээлэл байна.
					</p>
				</div>
			</div>

			{/* Profile Section */}
			<section className="grid gap-4 lg:grid-cols-3">
				<div className="rounded-2xl border bg-card p-5 lg:col-span-2">
					<div className="flex items-start gap-4">
						{/* Avatar */}
						<div className="shrink-0">
							<div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
								{user.avatarUrl ? (
									<Image
										src={user.avatarUrl}
										alt={user.name || "Profile"}
										width={80}
										height={80}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
										{user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
									</div>
								)}
							</div>
						</div>

						{/* User Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div>
									<h2 className="text-xl font-semibold truncate">{user.name || "Нэр оруулаагүй"}</h2>
									<p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role] || user.role}</p>
								</div>
								<Button variant="ghost" size="icon" asChild>
									<Link href="/dashboard/settings" title="Тохиргоо">
										<Settings className="h-5 w-5" />
									</Link>
								</Button>
							</div>

							<div className="mt-3 space-y-1.5">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Mail className="h-4 w-4" />
									<span className="truncate">{user.email}</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar className="h-4 w-4" />
									<span>Үүсгэсэн эвент: {createdEvents.length}</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" />
									<span>Оролцсон эвент: {participatingEvents.length}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Stats */}
					<div className="mt-5 grid gap-3 sm:grid-cols-3">
						<div className="rounded-xl border bg-background p-4">
							<div className="text-sm text-muted-foreground">Үүсгэсэн</div>
							<div className="mt-2 text-2xl font-semibold">{createdEvents.length}</div>
						</div>
						<div className="rounded-xl border bg-background p-4">
							<div className="text-sm text-muted-foreground">Оролцож буй</div>
							<div className="mt-2 text-2xl font-semibold">{participatingEvents.length}</div>
						</div>
						<div className="rounded-xl border bg-background p-4">
							<div className="text-sm text-muted-foreground">Хадгалсан</div>
							<div className="mt-2 text-2xl font-semibold">{likedIds.length}</div>
						</div>
					</div>
				</div>

				{/* Quick Actions */}
				<div className="rounded-2xl border bg-card p-5">
					<h3 className="font-semibold">Түргэн үйлдлүүд</h3>
					<div className="mt-4 space-y-2">
						<Button className="w-full justify-start" variant="secondary" asChild>
							<Link href="/events/create">
								<Calendar className="mr-2 h-4 w-4" />
								Эвент үүсгэх
							</Link>
						</Button>
						<Button className="w-full justify-start" variant="secondary" asChild>
							<Link href="/likes">
								<Heart className="mr-2 h-4 w-4" />
								Хадгалсан эвентүүд
							</Link>
						</Button>
						<Button className="w-full justify-start" variant="secondary" asChild>
							<Link href="/dashboard/settings">
								<Settings className="mr-2 h-4 w-4" />
								Профайл засах
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Interests Section */}

			{/* Created Events */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Миний үүсгэсэн эвентүүд</h2>
				</div>
				{createdEvents.length === 0 ? (
					<div className="rounded-xl border bg-card p-6 text-center">
						<p className="text-muted-foreground">Та одоогоор эвент үүсгээгүй байна.</p>
						<Button className="mt-4" asChild>
							<Link href="/events/create">Эвент үүсгэх</Link>
						</Button>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{createdEvents.map((event) => (
							<div key={event.id} className="relative">
								<EventCard
									event={event}
									href={`/events/${event.id}`}
									variant="dashboard"
									isAuthed
									initialLiked={likedSet.has(event.id)}
								/>
								<Link
									href={`/dashboard/events/${event.id}/edit`}
									className="absolute right-3 bottom-3 z-10 rounded-full bg-background/90 p-2 shadow-sm hover:bg-accent transition-colors"
									title="Засах"
								>
									<Pencil className="h-4 w-4" />
								</Link>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Participating Events */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Миний оролцож буй эвентүүд</h2>
				</div>
				{participatingEvents.length === 0 ? (
					<div className="rounded-xl border bg-card p-6 text-center">
						<p className="text-muted-foreground">Та одоогоор ямар ч эвентэд бүртгүүлээгүй байна.</p>
						<Button className="mt-4" variant="secondary" asChild>
							<Link href="/events">Эвентүүд үзэх</Link>
						</Button>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{participatingEvents.map((event) => (
							<EventCard
								key={event.id}
								event={event}
								href={`/events/${event.id}`}
								isAuthed
								initialLiked={likedSet.has(event.id)}
							/>
						))}
					</div>
				)}
			</section>

			{/* Recommended Events */}
			
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold">Танд санал болгож буй эвентүүд</h2>
						{user.interests && user.interests.length > 0 &&  (
							<p className="text-sm text-muted-foreground">
								Таны сонирхол:{" "}
								{user.interests 
									.map((slug: string) => CATEGORIES.find((c) => c.slug === slug)?.labelMn)
									.filter(Boolean)
									.join(", ")}
							</p>
						)}
						
					</div>
					<Link href="/events" className="text-sm text-muted-foreground hover:underline">
						Бүгдийг үзэх
					</Link>
				</div>
				{recommendedEvents.length === 0 ? (
					<div className="rounded-xl border bg-card p-6 text-center">
						<p className="text-muted-foreground">
							Таны сонирхолд тохирсон эвент одоогоор байхгүй байна.
						</p>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{recommendedEvents.map((event) => (
							<EventCard
								key={event.id}
								event={event}
								href={`/events/${event.id}`}
								isAuthed
								initialLiked={likedSet.has(event.id)}
							/>
						))}
					</div>
				)}
			</section>
		
		</div>
	)
}
