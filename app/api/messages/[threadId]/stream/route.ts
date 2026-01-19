import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getThreadIdCandidates } from "@/lib/messages/thread-id"

async function resolveThreadParts(threadId: string): Promise<
	| { eventId: string; otherUserId: string }
	| null
> {
	const candidates = getThreadIdCandidates(threadId)
	for (const candidate of candidates) {
		const [event, otherUser] = await Promise.all([
			prisma.event.findUnique({ where: { id: candidate.eventId }, select: { id: true } }),
			prisma.user.findUnique({ where: { id: candidate.otherUserId }, select: { id: true } }),
		])
		if (!event || !otherUser) continue
		return candidate
	}
	return null
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// SSE (Server-Sent Events) streaming endpoint for real-time messages
export async function GET(
	req: Request,
	ctx: { params: Promise<{ threadId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return new Response("Unauthorized", { status: 401 })
	}

	const { threadId } = await ctx.params
	const resolved = await resolveThreadParts(threadId)
	if (!resolved) {
		return new Response("Invalid thread ID", { status: 400 })
	}

	const { eventId, otherUserId } = resolved

	const userId = session.userId
	const url = new URL(req.url)
	const lastId = url.searchParams.get("lastId")

	// Шинэ мессежүүдийг авах
	try {
		const messages = await prisma.privateMessage.findMany({
			where: {
				eventId,
				OR: [
					{ senderId: userId, receiverId: otherUserId },
					{ senderId: otherUserId, receiverId: userId },
				],
				...(lastId ? { 
					createdAt: { 
						gt: new Date(parseInt(lastId)) 
					} 
				} : {}),
			},
			include: {
				sender: { select: { id: true, name: true, avatarUrl: true } },
			},
			orderBy: { createdAt: "asc" },
			take: 50,
		})

		// Уншаагүй мессежүүдийг уншсан болгох
		const unreadIds = messages
			.filter((m) => m.receiverId === userId && !m.isRead)
			.map((m) => m.id)
		
		if (unreadIds.length > 0) {
			await prisma.privateMessage.updateMany({
				where: { id: { in: unreadIds } },
				data: { isRead: true },
			})
		}

		return Response.json({
			messages: messages.map((msg) => ({
				id: msg.id,
				content: msg.content,
				senderId: msg.senderId,
				senderName: msg.sender.name,
				senderAvatar: msg.sender.avatarUrl,
				createdAt: msg.createdAt,
				isOwn: msg.senderId === userId,
			})),
		})
	} catch (error) {
		console.error("Stream error:", error)
		return Response.json({ messages: [] })
	}
}
