import { prisma } from "@/lib/db/client"

/**
 * Get unread notification count for a user
 * Uses readAt IS NULL for accurate tracking
 * Excludes MESSAGE type - those are shown in message badge
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
	try {
		return await prisma.notification.count({
			where: {
				userId,
				readAt: null,
				type: { not: "MESSAGE" }, // MESSAGE төрлийг хасах
			},
		})
	} catch {
		return 0
	}
}

/**
 * Get unread message count for a user across all conversations
 * Counts messages where createdAt > user's lastReadAt in that conversation
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
	try {
		// Get all conversation memberships for this user
		const memberships = await prisma.conversationMember.findMany({
			where: { userId },
			select: {
				conversationId: true,
				lastReadAt: true,
			},
		})

		if (memberships.length === 0) return 0

		// Count unread messages in each conversation
		let totalUnread = 0

		for (const membership of memberships) {
			const count = await prisma.message.count({
				where: {
					conversationId: membership.conversationId,
					deletedAt: null,
					senderId: { not: userId }, // Don't count own messages
					...(membership.lastReadAt && {
						createdAt: { gt: membership.lastReadAt },
					}),
				},
			})
			totalUnread += count
		}

		return totalUnread
	} catch {
		return 0
	}
}

/**
 * Get combined badge counts for navbar
 */
export async function getBadgeCounts(userId: string): Promise<{
	notifications: number
	messages: number
	total: number
}> {
	const [notifications, messages] = await Promise.all([
		getUnreadNotificationCount(userId),
		getUnreadMessageCount(userId),
	])

	return {
		notifications,
		messages,
		total: notifications + messages,
	}
}

/**
 * Get unread count per conversation for a user
 */
export async function getConversationUnreadCounts(
	userId: string
): Promise<Map<string, number>> {
	const memberships = await prisma.conversationMember.findMany({
		where: { userId },
		select: {
			conversationId: true,
			lastReadAt: true,
		},
	})

	const counts = new Map<string, number>()

	await Promise.all(
		memberships.map(async (m) => {
			const count = await prisma.message.count({
				where: {
					conversationId: m.conversationId,
					deletedAt: null,
					senderId: { not: userId },
					...(m.lastReadAt && { createdAt: { gt: m.lastReadAt } }),
				},
			})
			counts.set(m.conversationId, count)
		})
	)

	return counts
}
