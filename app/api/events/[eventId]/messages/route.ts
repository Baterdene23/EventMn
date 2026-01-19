import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const { eventId } = await params

	const messages = await prisma.eventMessage.findMany({
		where: { eventId },
		orderBy: { createdAt: "asc" },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					avatarUrl: true,
				},
			},
		},
	})

	return NextResponse.json({
		messages: messages.map((m) => ({
			id: m.id,
			content: m.content,
			userId: m.userId,
			userName: m.user.name ?? "Хэрэглэгч",
			userAvatar: m.user.avatarUrl,
			createdAt: m.createdAt.toISOString(),
		})),
	})
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { eventId } = await params

	// Check if event exists
	const event = await prisma.event.findUnique({
		where: { id: eventId },
	})
	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	const body = (await request.json().catch(() => null)) as { content?: string } | null
	if (!body?.content?.trim()) {
		return NextResponse.json({ error: "Content is required" }, { status: 400 })
	}

	const message = await prisma.eventMessage.create({
		data: {
			content: body.content.trim(),
			eventId,
			userId: session.userId,
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					avatarUrl: true,
				},
			},
		},
	})

	// Broadcast to SSE clients (stored in global map)
	const clients = (globalThis as Record<string, unknown>).__messageClients as Map<string, Set<ReadableStreamDefaultController>> | undefined
	if (clients) {
		const eventClients = clients.get(eventId)
		if (eventClients) {
			const messageData = JSON.stringify({
				id: message.id,
				content: message.content,
				userId: message.userId,
				userName: message.user.name ?? "Хэрэглэгч",
				userAvatar: message.user.avatarUrl,
				createdAt: message.createdAt.toISOString(),
			})
			
			for (const controller of eventClients) {
				try {
					controller.enqueue(`data: ${messageData}\n\n`)
				} catch {
					// Client disconnected
				}
			}
		}
	}

	return NextResponse.json({
		message: {
			id: message.id,
			content: message.content,
			userId: message.userId,
			userName: message.user.name ?? "Хэрэглэгч",
			userAvatar: message.user.avatarUrl,
			createdAt: message.createdAt.toISOString(),
		},
	}, { status: 201 })
}
