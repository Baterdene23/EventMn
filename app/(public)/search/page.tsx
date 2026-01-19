import Link from "next/link"

import { EventCard } from "@/components/events/EventCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Section, SectionHeader } from "@/components/layout/Section"
import { getPublicEvents, searchEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"

interface PageProps {
	searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: PageProps) {
	const { q } = await searchParams
	const session = await getSession()
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()

	const query = q?.trim() ?? ""
	
	// Use database search if query exists, otherwise get all events
	const results = query ? await searchEvents(query) : []
	const allEvents = query ? [] : await getPublicEvents()

	return (
		<div className="space-y-8">
			<PageHeader
				title="Эвент хайх"
				subtitle={query ? `"${q}" хайлтын үр дүн` : "Эвент нэр, ангилал, байршлаар хайх"}
			/>

			{query && (
				<Section>
					<SectionHeader
						title={`${results.length} эвент олдлоо`}
						action={
							<Link href="/events" className="text-sm text-muted-foreground hover:underline">
								Бүх эвентүүд
							</Link>
						}
					/>
					{results.length > 0 ? (
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{results.map((event) => (
								<EventCard
									key={event.id}
									event={event}
									href={`/events/${event.id}`}
									isAuthed={!!session}
									initialLiked={likedIds.has(event.id)}
								/>
							))}
						</div>
					) : (
						<div className="rounded-lg border bg-card p-8 text-center">
							<p className="text-muted-foreground">
								&quot;{q}&quot; хайлтаар эвент олдсонгүй.
							</p>
							<Link href="/events" className="mt-4 inline-block text-sm text-primary hover:underline">
								Бүх эвентүүд үзэх
							</Link>
						</div>
					)}
				</Section>
			)}

			{!query && (
				<Section>
					<SectionHeader title="Сүүлийн эвентүүд" />
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{allEvents.slice(0, 6).map((event) => (
							<EventCard
								key={event.id}
								event={event}
								href={`/events/${event.id}`}
								isAuthed={!!session}
								initialLiked={likedIds.has(event.id)}
							/>
						))}
					</div>
				</Section>
			)}
		</div>
	)
}
