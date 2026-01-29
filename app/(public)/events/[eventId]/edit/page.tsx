import { notFound, redirect } from "next/navigation"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"
import { EventEditForm } from "@/components/events/EventEditForm"

export default async function EventEditPage({
	params,
}: {
	params: Promise<{ eventId: string }>
}) {
	const { eventId } = await params
	const session = await getSession()

	if (!session) {
		redirect(`/login?returnTo=/dashboard/events/${eventId}/edit`)
	}

	const event = await prisma.event.findUnique({
		where: { id: eventId },
	})

	if (!event) {
		notFound()
	}

	if (event.ownerId !== session.userId) {
		notFound()
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Эвент засах</h1>
				<p className="text-sm text-muted-foreground">
					Эвентийн мэдээллийг өөрчилнө үү.
				</p>
			</div>

			<div className="rounded-2xl border bg-card p-6">
				<EventEditForm
					event={{
						id: event.id,
						title: event.title,
						excerpt: event.excerpt,
						description: event.description,
						date: event.date,
						startAt: event.startAt?.toISOString(),
						city: event.city,
						location: event.location,
						category: event.category,
						price: event.price,
						capacity: event.capacity,
						imageSrc: event.imageSrc,
						status: event.status,
						isOnline: event.isOnline,
						meetingUrl: event.meetingUrl,
					}}
				/>
			</div>
		</div>
	)
}
