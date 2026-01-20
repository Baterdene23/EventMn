import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

type Params = { params: Promise<{ conversationId: string }> }

/**
 * GET /api/conversations/[conversationId]
 * Get conversation details with messages
 */
export async function GET(_req: Request, { params }: Params) {
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

	// Get conversation with messages (excluding soft-deleted)
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
		include: {
			members: {
				include: {
					user: { select: { id: true, name: true, avatarUrl: true } },
				},
			},
			messages: {
				where: { deletedAt: null },
				orderBy: { createdAt: "asc" },
				include: {
					sender: { select: { id: true, name: true, avatarUrl: true } },
				},
			},
		},
	})

	if (!conversation) {
		return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
	}

	// Mark as read by updating lastReadAt
	await prisma.conversationMember.update({
		where: {
			conversationId_userId: {
				conversationId,
				userId,
			},
		},
		data: { lastReadAt: new Date() },
	})

	const otherMembers = conversation.members.filter((m) => m.userId !== userId)

	return NextResponse.json({
		id: conversation.id,
		participants: otherMembers.map((m) => ({
			id: m.user.id,
			name: m.user.name,
			avatarUrl: m.user.avatarUrl,
		})),
		messages: conversation.messages.map((m) => ({
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
