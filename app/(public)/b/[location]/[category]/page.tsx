import Link from "next/link"
import { notFound } from "next/navigation"

import { EventCard } from "@/components/events/EventCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Section, SectionHeader } from "@/components/layout/Section"
import { CATEGORIES, getCategoryBySlug, getLocationBySlug, LOCATIONS } from "@/lib/data/categories"
import { getPublicEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"

interface PageProps {
	params: Promise<{ location: string; category: string }>
}

export default async function CategoryBrowseByLocationPage({ params }: PageProps) {
	const { location, category } = await params
	const locationData = getLocationBySlug(location)
	const categoryData = getCategoryBySlug(category)

	if (!locationData || !categoryData) {
		notFound()
	}

	const session = await getSession()
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()

	const allEvents = await getPublicEvents()
	const events = allEvents.filter((e) => {
		const matchesLocation =
			e.city.toLowerCase().includes(locationData.name.toLowerCase()) ||
			e.city.toLowerCase().includes(locationData.nameMn.toLowerCase()) ||
			(locationData.slug === "online" && e.city.toLowerCase().includes("онлайн"))
		const matchesCategory =
			e.category?.toLowerCase().includes(categoryData.label.toLowerCase()) ||
			e.category?.toLowerCase().includes(categoryData.labelMn.toLowerCase())
		return matchesLocation && matchesCategory
	})

	return (
		<div className="space-y-8">
			<PageHeader
				title={`${categoryData.labelMn} - ${locationData.nameMn}`}
				subtitle={`${categoryData.label} эвентүүд ${locationData.name} хотод`}
			/>

			<Section>
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<Link
							key={cat.slug}
							href={`/b/${location}/${cat.slug}`}
							className={`rounded-full border px-4 py-2 text-sm transition-colors ${
								cat.slug === category
									? "bg-primary text-primary-foreground"
									: "bg-card hover:bg-accent"
							}`}
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
						<Link href={`/d/${location}`} className="text-sm text-muted-foreground hover:underline">
							Бүх ангилал
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
						<p className="text-muted-foreground">Энэ ангилалд эвент олдсонгүй.</p>
						<Link href={`/d/${location}`} className="mt-4 inline-block text-sm text-primary hover:underline">
							Бүх эвентүүд үзэх
						</Link>
					</div>
				)}
			</Section>
		</div>
	)
}

export function generateStaticParams() {
	return LOCATIONS.flatMap((loc) => CATEGORIES.map((cat) => ({ location: loc.slug, category: cat.slug })))
}
