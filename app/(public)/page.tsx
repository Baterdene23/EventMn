import Link from "next/link"

import { EventCard } from "@/components/events/EventCard"
import { CategoryNav } from "@/components/events/CategoryNav"
import { LocationGrid } from "@/components/events/LocationCard"
import { Section, SectionHeader } from "@/components/layout/Section"
import { Button } from "@/components/ui/Button"
import { getSession } from "@/lib/auth/session"
import { getPublicFeaturedEvents, getPublicEvents } from "@/lib/data/events"
import { getLikedEventIds } from "@/lib/data/likes"
import { LOCATIONS } from "@/lib/data/categories"

export default async function PublicHomePage() {
	const session = await getSession()
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()
	const featuredEvents = await getPublicFeaturedEvents(4)
	const allEvents = await getPublicEvents()

	return (
		<div className="space-y-12">
			{/* Hero Section */}
			<section className="space-y-6">
				<div className="space-y-4">
					<h1 className="text-4xl font-bold leading-tight md:text-5xl">
						Монголын эвентүүдийг нэг дороос
					</h1>
					<p className="max-w-2xl text-lg text-muted-foreground">
						Хөгжим, урлаг, бизнес, технологи болон бусад бүх төрлийн арга хэмжээг олж, бүртгүүлээрэй.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Button size="lg" asChild>
						<Link href="/events">Эвентүүд үзэх</Link>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<Link href="/events/create">Эвент үүсгэх</Link>
					</Button>
				</div>
			</section>

			{/* Category Navigation */}
			<Section>
				<CategoryNav />
			</Section>

			{/* Featured Events */}
			<Section>
				<SectionHeader
					title="Онцлох эвентүүд"
					action={
						<Link href="/events" className="text-sm text-muted-foreground hover:underline">
							Бүгдийг үзэх
						</Link>
					}
				/>
				<div className="grid gap-6 md:grid-cols-2">
					{featuredEvents.map((event) => (
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

			{/* Browse by Location */}
			<Section>
				<SectionHeader title="Байршлаар хайх" />
				<LocationGrid locations={LOCATIONS} />
			</Section>

			{/* All Events */}
			<Section>
				<SectionHeader
					title="Бүх эвентүүд"
					action={
						<Link href="/events" className="text-sm text-muted-foreground hover:underline">
							Бүгдийг үзэх
						</Link>
					}
				/>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{allEvents.slice(0, 3).map((event) => (
						<EventCard
							key={event.id}
							event={event}
							href={`/events/${event.id}`}
							size="compact"
							isAuthed={!!session}
							initialLiked={likedIds.has(event.id)}
						/>
					))}
				</div>
				{allEvents.length > 3 && (
					<div className="mt-6 text-center">
						<Button variant="outline" asChild>
							<Link href="/events">Бүх эвентүүд үзэх ({allEvents.length})</Link>
							
						</Button>
					</div>
				)}
			</Section>
		</div>
	)
}
