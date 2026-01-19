import Link from "next/link"
import { notFound } from "next/navigation"

import { EventCard } from "@/components/events/EventCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Section, SectionHeader } from "@/components/layout/Section"
import { getLocationBySlug, CATEGORIES } from "@/lib/data/categories"
import { getPublicEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"

interface PageProps {
	params: Promise<{ location: string }>
}

export default async function LocationEventsPage({ params }: PageProps) {
	const { location } = await params
	const locationData = getLocationBySlug(location)

	if (!locationData) {
		notFound()
	}

	const session = await getSession()
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()

	const allEvents = await getPublicEvents()
	const events = allEvents.filter(
		(e) => e.city.toLowerCase().includes(locationData.name.toLowerCase()) ||
			e.city.toLowerCase().includes(locationData.nameMn.toLowerCase()) ||
			locationData.slug === "online" && e.city.toLowerCase().includes("онлайн")
	)

	return (
		<div className="space-y-8">
			<PageHeader
				title={`${locationData.nameMn} дахь эвентүүд`}
				subtitle={`${locationData.name}, ${locationData.country} - бүх эвентүүд`}
			/>

			<Section>
				<SectionHeader title="Ангилал" />
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<Link
							key={cat.slug}
							href={`/b/${location}/${cat.slug}`}
							className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
						>
							{cat.labelMn}
						</Link>
					))}
				</div>
			</Section>

			<Section>
				<SectionHeader
					title={`${events.length} эвент олдлоо`}
					action={
						<Link href="/events" className="text-sm text-muted-foreground hover:underline">
							Бүх эвентүүд
						</Link>
					}
				/>
				{events.length > 0 ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{events.map((event) => (
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
							Энэ байршилд эвент олдсонгүй.
						</p>
						<Link href="/events" className="mt-4 inline-block text-sm text-primary hover:underline">
							Бүх эвентүүд үзэх
						</Link>
					</div>
				)}
			</Section>
		</div>
	)
}

export function generateStaticParams() {
	return [
		{ location: "ulaanbaatar" },
		{ location: "darkhan" },
		{ location: "erdenet" },
		{ location: "online" },
	]
}
