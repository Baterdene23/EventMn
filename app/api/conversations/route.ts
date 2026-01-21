import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

/**
 * GET /api/conversations
 * List all conversations for the current user with unread counts
 */
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const userId = session.userId

	// Get all conversations where user is a member
	const memberships = await prisma.conversationMember.findMany({
		where: { userId },
		include: {
			conversation: {
				include: {
					members: {
						include: {
							user: {
								select: { id: true, name: true, avatarUrl: true },
							},
						},
					},
					messages: {
						where: { deletedAt: null },
						orderBy: { createdAt: "desc" },
						take: 1,
						include: {
							sender: {
								select: { id: true, name: true },
							},
						},
					},
				},
			},
		},
		orderBy: { conversation: { updatedAt: "desc" } },
	})

	const conversations = await Promise.all(
		memberships.map(async (membership) => {
			const conversation = membership.conversation
			const otherMembers = conversation.members.filter((m) => m.userId !== userId)
			const lastMessage = conversation.messages[0]

			// Count unread messages (messages created after user's lastReadAt)
			const unreadCount = await prisma.message.count({
				where: {
					conversationId: conversation.id,
					deletedAt: null,
					createdAt: membership.lastReadAt
						? { gt: membership.lastReadAt }
						: undefined,
					senderId: { not: userId }, // Don't count own messages
				},
			})

			return {
				id: conversation.id,
				participants: otherMembers.map((m) => ({
					id: m.user.id,
					name: m.user.name,
					avatarUrl: m.user.avatarUrl,
				})),
				lastMessage: lastMessage
					? {
							id: lastMessage.id,
							content: lastMessage.content,
							senderId: lastMessage.senderId,
							senderName: lastMessage.sender.name,
							createdAt: lastMessage.createdAt,
						}
					: null,
				unreadCount,
				updatedAt: conversation.updatedAt,
			}
		})
	)

	// Calculate total unread count
	const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
	
	// Count how many PEOPLE/conversations have unread messages
	const unreadPeopleCount = conversations.filter((c) => c.unreadCount > 0).length

	return NextResponse.json({
		conversations,
		totalUnreadCount,
		unreadPeopleCount,
	})
}

/**
 * POST /api/conversations
 * Create a new conversation or return existing one between users
 */
export async function POST(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = await request.json()
	const { participantIds } = body as { participantIds?: string[] }

	if (!participantIds || participantIds.length === 0) {
		return NextResponse.json(
			{ error: "participantIds шаардлагатай" },
			{ status: 400 }
		)
	}

	const userId = session.userId
	const allMemberIds = [...new Set([userId, ...participantIds])]

	// Check if a conversation with exactly these members already exists
	const existingConversation = await prisma.conversation.findFirst({
		where: {
			members: {
				every: { userId: { in: allMemberIds } },
			},
			AND: {
				members: { none: { userId: { notIn: allMemberIds } } },
			},
		},
		include: {
			members: {
				include: {
					user: { select: { id: true, name: true, avatarUrl: true } },
				},
			},
		},
	})

	if (existingConversation) {
		return NextResponse.json({ conversation: existingConversation })
	}

	// Create new conversation
	const conversation = await prisma.conversation.create({
		data: {
			members: {
				create: allMemberIds.map((id) => ({ userId: id })),
			},
		},
		include: {
			members: {
				include: {
					user: { select: { id: true, name: true, avatarUrl: true } },
				},
			},
		},
	})

	return NextResponse.json({ conversation }, { status: 201 })
}
