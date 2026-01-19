import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { PrivateChat } from "@/components/events/PrivateChat"
import { getEventAccessRecordById } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export default async function EventMessagesPage({ params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params
	const session = await getSession()
	
	// Нэвтрээгүй бол login руу шилжүүлэх
	if (!session) {
		redirect(`/login?returnTo=${encodeURIComponent(`/events/${eventId}/messages`)}`)
	}

	const record = await getEventAccessRecordById(eventId)
	if (!record) notFound()

	// Published event л харагдана
	if (record.status !== "Published" && record.ownerId !== session.userId) {
		notFound()
	}

	const event = record.event

	// Event эзэн өөртэйгөө message бичих боломжгүй
	if (record.ownerId === session.userId) {
		redirect(`/events/${eventId}`)
	}

	// Event owner-ийн мэдээлэл авах
	const owner = await prisma.user.findUnique({
		where: { id: record.ownerId },
		select: { id: true, name: true, avatarUrl: true },
	})

	if (!owner) notFound()

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/events/${eventId}`}>
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-semibold">{event.title}</h1>
					<p className="text-sm text-muted-foreground">
						{owner.name ?? "Зохион байгуулагч"}-тай харилцах
					</p>
				</div>
			</div>

			{/* Private Chat */}
			<PrivateChat
				eventId={eventId}
				currentUserId={session.userId}
				otherUser={{
					id: owner.id,
					name: owner.name ?? "Зохион байгуулагч",
					avatarUrl: owner.avatarUrl ?? undefined,
				}}
			/>
		</div>
	)
}
