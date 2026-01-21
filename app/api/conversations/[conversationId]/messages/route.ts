import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getPusher } from "@/lib/pusher/server"

type Params = { params: Promise<{ conversationId: string }> }

/**
 * GET /api/conversations/[conversationId]/messages
 * Get messages with pagination
 */
export async function GET(req: Request, { params }: Params) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { conversationId } = await params
	const userId = session.userId

	// Verify user is a member
	const membership = await prisma.conversationMember.findUnique({
		where: {
			conversationId_userId: {
				conversationId,
				userId,
			},
		},
	})

	if (!membership) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 })
	}

	const { searchParams } = new URL(req.url)
	const cursor = searchParams.get("cursor")
	const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

	const messages = await prisma.message.findMany({
		where: {
			conversationId,
			deletedAt: null,
		},
		orderBy: { createdAt: "desc" },
		take: limit + 1,
		...(cursor && {
			cursor: { id: cursor },
			skip: 1,
		}),
		include: {
			sender: { select: { id: true, name: true, avatarUrl: true } },
		},
	})

	const hasMore = messages.length > limit
	const items = hasMore ? messages.slice(0, -1) : messages

	return NextResponse.json({
		messages: items.reverse().map((m) => ({
			id: m.id,
			content: m.content,
			senderId: m.senderId,
			senderName: m.sender.name,
			senderAvatar: m.sender.avatarUrl,
			createdAt: m.createdAt,
			isOwn: m.senderId === userId,
		})),
		nextCursor: hasMore ? items[0]?.id : null,
	})
}

/**
 * POST /api/conversations/[conversationId]/messages
 * Send a new message
 */
export async function POST(req: Request, { params }: Params) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { conversationId } = await params
	const userId = session.userId

	// Verify user is a member
	const membership = await prisma.conversationMember.findUnique({
		where: {
			conversationId_userId: {
				conversationId,
				userId,
			},
		},
	})

	if (!membership) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 })
	}

	const body = await req.json()
	const { content } = body

	if (!content || typeof content !== "string" || content.trim().length === 0) {
		return NextResponse.json({ error: "Message content required" }, { status: 400 })
	}

	// Create message and update conversation timestamp
	const [message] = await prisma.$transaction([
		prisma.message.create({
			data: {
				conversationId,
				senderId: userId,
				content: content.trim(),
			},
			include: {
				sender: { select: { id: true, name: true, avatarUrl: true } },
			},
		}),
		prisma.conversation.update({
			where: { id: conversationId },
			data: { updatedAt: new Date() },
		}),
		// Update sender's lastReadAt
		prisma.conversationMember.update({
			where: {
				conversationId_userId: {
					conversationId,
					userId,
				},
			},
			data: { lastReadAt: new Date() },
		}),
	])

	// Trigger real-time event via Pusher
	const pusher = getPusher()
	if (pusher) {
		try {
			await pusher.trigger(`conversation-${conversationId}`, "new-message", {
				id: message.id,
				content: message.content,
				senderId: message.senderId,
				senderName: message.sender.name,
				senderAvatar: message.sender.avatarUrl,
				createdAt: message.createdAt,
			})
		} catch (error) {
			console.error("Pusher trigger error:", error)
		}
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

/**
 * DELETE /api/conversations/[conversationId]/messages
 * Soft delete a message (body: { messageId })
 */
export async function DELETE(req: Request, { params }: Params) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { conversationId } = await params
	const userId = session.userId

	const body = await req.json()
	const { messageId } = body as { messageId?: string }

	if (!messageId) {
		return NextResponse.json({ error: "messageId шаардлагатай" }, { status: 400 })
	}

	// Find message and verify ownership
	const message = await prisma.message.findUnique({
		where: { id: messageId },
	})

	if (!message) {
		return NextResponse.json({ error: "Message not found" }, { status: 404 })
	}

	if (message.conversationId !== conversationId) {
		return NextResponse.json({ error: "Message not in this conversation" }, { status: 400 })
	}

	// Only sender can delete their own message
	if (message.senderId !== userId) {
		return NextResponse.json({ error: "Зөвхөн өөрийн мессежийг устгах боломжтой" }, { status: 403 })
	}

	// Soft delete
	await prisma.message.update({
		where: { id: messageId },
		data: { deletedAt: new Date() },
	})

	return NextResponse.json({ ok: true })
}
