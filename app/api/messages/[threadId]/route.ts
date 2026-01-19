import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { formatThreadId, getThreadIdCandidates } from "@/lib/messages/thread-id"

async function resolveThreadParts(threadId: string): Promise<
	| {
			eventId: string
			otherUserId: string
			event: { id: string; title: string; imageSrc: string | null; ownerId: string }
			otherUser: { id: string; name: string | null; avatarUrl: string | null }
		}
	| null
> {
	const candidates = getThreadIdCandidates(threadId)
	for (const candidate of candidates) {
		const [event, otherUser] = await Promise.all([
			prisma.event.findUnique({
				where: { id: candidate.eventId },
				select: { id: true, title: true, imageSrc: true, ownerId: true },
			}),
			prisma.user.findUnique({
				where: { id: candidate.otherUserId },
				select: { id: true, name: true, avatarUrl: true },
			}),
		])

		if (!event || !otherUser) continue
		return { ...candidate, event, otherUser }
	}

	return null
}

// Thread-ийн бүх мессежүүд
export async function GET(
	_req: Request,
	ctx: { params: Promise<{ threadId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { threadId } = await ctx.params
	const resolved = await resolveThreadParts(threadId)
	if (!resolved) {
		return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 })
	}

	const { eventId, otherUserId, event, otherUser } = resolved

	const userId = session.userId

	// Хоёр хэрэглэгчийн хооронд энэ event дээр солилцсон мессежүүд
	const messages = await prisma.privateMessage.findMany({
		where: {
			eventId,
			OR: [
				{ senderId: userId, receiverId: otherUserId },
				{ senderId: otherUserId, receiverId: userId },
			],
		},
		include: {
			sender: { select: { id: true, name: true, avatarUrl: true } },
		},
		orderBy: { createdAt: "asc" },
	})

	// Уншаагүй мессежүүдийг уншсан болгох
	await prisma.privateMessage.updateMany({
		where: {
			eventId,
			senderId: otherUserId,
			receiverId: userId,
			isRead: false,
		},
		data: { isRead: true },
	})

	return NextResponse.json({
		threadId,
		event,
		otherUser,
		messages: messages.map((m) => ({
			id: m.id,
			content: m.content,
			senderId: m.senderId,
			senderName: m.sender.name,
			senderAvatar: m.sender.avatarUrl,
			createdAt: m.createdAt,
			isOwn: m.senderId === userId,
		})),
	})
}

// Шинэ мессеж илгээх
export async function POST(
	req: Request,
	ctx: { params: Promise<{ threadId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { threadId } = await ctx.params
	const resolved = await resolveThreadParts(threadId)
	if (!resolved) {
		return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 })
	}

	const { eventId, otherUserId } = resolved

	const body = await req.json()
	const { content } = body

	if (!content || typeof content !== "string" || content.trim().length === 0) {
		return NextResponse.json({ error: "Message content required" }, { status: 400 })
	}

	const userId = session.userId

	// Event мэдээлэл авах (notification-д хэрэглэнэ)
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { title: true },
	})

	const message = await prisma.privateMessage.create({
		data: {
			content: content.trim(),
			eventId,
			senderId: userId,
			receiverId: otherUserId,
		},
		include: {
			sender: { select: { id: true, name: true, avatarUrl: true } },
		},
	})

	// Notification үүсгэх (хүснэгт байхгүй бол алдаа гаргахгүй)
	try {
		await prisma.notification.create({
			data: {
				userId: otherUserId,
				type: "MESSAGE",
				title: "Шинэ мессеж",
				message: `${message.sender.name || "Хэрэглэгч"}: ${content.trim().substring(0, 50)}${content.length > 50 ? "..." : ""}`,
				link: `/dashboard/messages/${formatThreadId(eventId, userId)}`,
				eventId,
				fromUserId: userId,
			},
		})
	} catch {
		// Notification table үүсээгүй байж магадгүй - алдааг үл тоо
	}

	return NextResponse.json({
		id: message.id,
		content: message.content,
		senderId: message.senderId,
		senderName: message.sender.name,
		senderAvatar: message.sender.avatarUrl,
		createdAt: message.createdAt,
		isOwn: true,
	})
}
