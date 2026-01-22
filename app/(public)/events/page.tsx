import type { EventSummary } from "@/components/events/EventCard"
import { EventCard } from "@/components/events/EventCard"
import { getDashboardCreatedEvents, getPublicEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

type SortableEvent = EventSummary & {
	location?: string
	startAt?: string
	endAt?: string
	price?: number
}

const EVENTS_PER_PAGE = 6

function normalizeText(input?: string | null): string {
	return String(input ?? "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim()
}

export default async function PublicEventsPage({
	searchParams,
}: {
	searchParams?: Promise<{ q?: string; location?: string; city?: string; sort?: string; page?: string }>
}) {
	const resolvedSearchParams = await searchParams
	const session = await getSession()

	const q = normalizeText(resolvedSearchParams?.q)
	const city = String(resolvedSearchParams?.city ?? "").trim()
	const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1", 10))

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

	// Pagination logic
	const totalEvents = allEvents.length
	const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE)
	const start = (page - 1) * EVENTS_PER_PAGE
	const paginatedEvents = allEvents.slice(start, start + EVENTS_PER_PAGE)

	// Build query string for pagination links
	const buildPaginationUrl = (pageNum: number): string => {
		const params = new URLSearchParams()
		if (q) params.set("q", resolvedSearchParams?.q ?? "")
		if (city) params.set("city", city)
		if (pageNum > 1) params.set("page", String(pageNum))
		const queryString = params.toString()
		return `/events${queryString ? `?${queryString}` : ""}`
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-10">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-3xl font-semibold tracking-tight">Эвентүүд</h1>
					<p className="text-sm text-muted-foreground">
						Нийт {totalEvents} эвент · {page} / {totalPages} хуудас
					</p>
				</div>
			</div>
			<div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{paginatedEvents.map((event) => {
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

			{totalPages > 1 && (
				<div className="mt-10">
					<Pagination>
						<PaginationContent>
							{page > 1 && (
								<PaginationItem>
									<PaginationPrevious href={buildPaginationUrl(page - 1)} />
								</PaginationItem>
							)}

							{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
								// Show first page, last page, current page, and pages around current
								const isVisible =
									pageNum === 1 ||
									pageNum === totalPages ||
									Math.abs(pageNum - page) <= 1

								if (!isVisible) return null

								// Show ellipsis if gap exists
								if (pageNum === 2 && page > 3) {
									return (
										<PaginationItem key="ellipsis-start">
											<span className="px-1.5 py-2">...</span>
										</PaginationItem>
									)
								}
								if (pageNum === totalPages - 1 && page < totalPages - 2) {
									return (
										<PaginationItem key="ellipsis-end">
											<span className="px-1.5 py-2">...</span>
										</PaginationItem>
									)
								}

								return (
									<PaginationItem key={pageNum}>
										<PaginationLink
											href={buildPaginationUrl(pageNum)}
											isActive={pageNum === page}
										>
											{pageNum}
										</PaginationLink>
									</PaginationItem>
								)
							})}

							{page < totalPages && (
								<PaginationItem>
									<PaginationNext href={buildPaginationUrl(page + 1)} />
								</PaginationItem>
							)}
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	)
}
