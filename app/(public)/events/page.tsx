import type { EventSummary } from "@/components/events/EventCard"
import { EventCard } from "@/components/events/EventCard"
import { getDashboardCreatedEvents, getPublicEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"

type SortableEvent = EventSummary & {
	location?: string
	startAt?: string
	endAt?: string
	price?: number
}

function normalizeText(input?: string | null): string {
	return String(input ?? "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim()
}

export default async function PublicEventsPage({
	searchParams,
}: {
	searchParams?: Promise<{ q?: string; location?: string; city?: string; sort?: string }>
}) {
	const resolvedSearchParams = await searchParams
	const session = await getSession()

	const q = normalizeText(resolvedSearchParams?.q)
	const city = String(resolvedSearchParams?.city ?? "").trim()

	const [likedIdsArray, publicEvents, myCreatedEvents] = await Promise.all([
		session ? getLikedEventIds(session.userId) : Promise.resolve([]),
		getPublicEvents(),
		session ? getDashboardCreatedEvents(session.userId) : Promise.resolve([]),
	])

	const likedIds = new Set(likedIdsArray)
	const ownedIds = new Set(myCreatedEvents.map((e) => e.id))
	const byId = new Map<string, EventSummary>()
	for (const e of myCreatedEvents) byId.set(e.id, e)
	for (const e of publicEvents) if (!byId.has(e.id)) byId.set(e.id, e)
	let allEvents = Array.from(byId.values())

	// filter: нэрээр хайх
	if (q) {
		allEvents = allEvents.filter((e: SortableEvent) => normalizeText(e.title).includes(q))
	}

	// filter: хот (exact, case-insensitive)
	if (city) {
		const c = normalizeText(city)
		allEvents = allEvents.filter((e: SortableEvent) => normalizeText(e.city) === c)
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-10">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-semibold tracking-tight">Эвентүүд</h1>
				</div>
			</div>
			<div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{allEvents.map((event) => {
					const owned = ownedIds.has(event.id)
					return (
						<EventCard
							key={event.id}
							event={event}
							href={`/events/${event.id}`}
							size="compact"
							variant={owned ? "dashboard" : "public"}
							isAuthed={!!session}
							initialLiked={likedIds.has(event.id)}
						/>
					)
				})}
			</div>
		</div>
	)
}
