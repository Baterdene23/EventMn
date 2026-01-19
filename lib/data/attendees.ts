import { prisma } from "@/lib/db/client"

export async function isUserAttending(userId: string, eventId: string): Promise<boolean> {
	const attendee = await prisma.attendee.findUnique({
		where: {
			userId_eventId: { userId, eventId },
		},
	})
	return !!attendee
}

export async function getAttendingEventIds(userId: string): Promise<string[]> {
	const attendees = await prisma.attendee.findMany({
		where: { userId },
		select: { eventId: true },
	})
	return attendees.map((a) => a.eventId)
}
