import Link from "next/link"
import { notFound } from "next/navigation"

import { EventCard } from "@/components/events/EventCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Section, SectionHeader } from "@/components/layout/Section"
import { CATEGORIES, getCategoryBySlug } from "@/lib/data/categories"
import { getPublicEvents } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"

interface PageProps {
	params: Promise<{ category: string }>
}

export default async function CategoryBrowsePage({ params }: PageProps) {
	const { category } = await params
	const categoryData = getCategoryBySlug(category)

	if (!categoryData) {
		notFound()
	}

	const session = await getSession()
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()

	// Get all public events and filter by category (all locations)
	const allEvents = await getPublicEvents()
	const events = allEvents.filter((e) => {
		const eventCategory = e.category?.toLowerCase() ?? ""
		return (
			eventCategory.includes(categoryData.label.toLowerCase()) ||
			eventCategory.includes(categoryData.labelMn.toLowerCase()) ||
			eventCategory.includes(categoryData.slug.replace(/-/g, " "))
		)
	})

	return (
		<div className="space-y-8">
			<PageHeader
				title={categoryData.labelMn}
				subtitle={`${categoryData.label} - Монгол даяар болж буй бүх эвентүүд`}
			/>

			{/* Category tabs */}
			<Section>
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<Link
							key={cat.slug}
							href={`/c/${cat.slug}`}
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
			{/* Events grid */}
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
							Энэ ангилалд эвент олдсонгүй.
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
	return CATEGORIES.map((cat) => ({ category: cat.slug }))
}
