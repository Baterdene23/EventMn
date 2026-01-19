import Link from "next/link"

import { EventCard } from "@/components/events/EventCard"
import { getSession } from "@/lib/auth/session"
import { getEventAccessRecordById } from "@/lib/data/events"
import { getLikedEventIds } from "@/lib/data/likes"

export default async function LikesPage() {
	const session = await getSession()
	if (!session) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Хадгалсан эвентүүд</h1>
				<p className="text-muted-foreground">
					Та <Link href="/login?returnTo=/likes" className="underline">нэвтрэх</Link> хэрэгтэй хадгалсан эвентүүдээ харахын тулд.
				</p>
			</div>
		)
	}

	const likedIds = await getLikedEventIds(session.userId)
	const likedSet = new Set(likedIds)

	// Resolve liked IDs into viewable event records. If an event becomes unavailable, we just skip it.
	const likedEventsPromises = likedIds.map(async (eventId) => {
		const record = await getEventAccessRecordById(eventId)
		if (!record) return null
		const canViewPublic = record.status === "Published"
		const canViewAsOwner = record.ownerId === session.userId
		return canViewPublic || canViewAsOwner ? record.event : null
	})
	
	const likedEventsResults = await Promise.all(likedEventsPromises)
	const likedEvents = likedEventsResults.filter((e): e is NonNullable<typeof e> => Boolean(e))

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Хадгалсан эвентүүд</h1>
			</div>

			{likedEvents.length === 0 ? (
				<div className="rounded-xl border bg-card p-6 text-card-foreground">
					<p className="font-medium">Хадгалсан эвент байхгүй байна</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Ямар нэг эвент дээр зүрх дарж хадгалаарай.
					</p>
					<div className="mt-4">
						<Link href="/events" className="underline">
							Эвентүүдийг үзэх
						</Link>
					</div>
				</div>
			) : (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{likedEvents.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							href={`/events/${event.id}`}
							size="compact"
							isAuthed
							initialLiked={likedSet.has(event.id)}
						/>
					))}
				</div>
			)}
		</div>
	)
}
