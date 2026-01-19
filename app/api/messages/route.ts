import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { formatThreadId } from "@/lib/messages/thread-id"

// Thread-үүдийн жагсаалт - current user-ийн бүх private message threads
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const userId = session.userId

	// User-ийн илгээсэн болон хүлээн авсан бүх мессежүүдийг авах
	const messages = await prisma.privateMessage.findMany({
		where: {
			OR: [{ senderId: userId }, { receiverId: userId }],
		},
		include: {
			event: { select: { id: true, title: true, imageSrc: true } },
			sender: { select: { id: true, name: true, avatarUrl: true } },
			receiver: { select: { id: true, name: true, avatarUrl: true } },
		},
		orderBy: { createdAt: "desc" },
	})

	// Thread-үүдийг group хийх (eventId + otherUserId)
	const threadMap = new Map<
		string,
		{
			threadId: string
			eventId: string
			eventTitle: string
			eventImage: string | null
			otherUser: { id: string; name: string | null; avatarUrl: string | null }
			lastMessage: string
			lastMessageAt: Date
			unreadCount: number
		}
	>()

	for (const msg of messages) {
		const otherUser = msg.senderId === userId ? msg.receiver : msg.sender
		const threadId = formatThreadId(msg.eventId, otherUser.id)

		if (!threadMap.has(threadId)) {
			threadMap.set(threadId, {
				threadId,
				eventId: msg.eventId,
				eventTitle: msg.event.title,
				eventImage: msg.event.imageSrc,
				otherUser,
				lastMessage: msg.content,
				lastMessageAt: msg.createdAt,
				unreadCount: msg.receiverId === userId && !msg.isRead ? 1 : 0,
			})
		} else {
			const existing = threadMap.get(threadId)!
			if (msg.receiverId === userId && !msg.isRead) {
				existing.unreadCount++
			}
		}
	}

	const threads = Array.from(threadMap.values()).sort(
		(a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
	)

	return NextResponse.json({ threads })
}
