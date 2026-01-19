import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const { eventId } = await params

	// Get event to find owner
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { ownerId: true },
	})

	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	// Get messages between current user and event owner for this event
	const messages = await prisma.privateMessage.findMany({
		where: {
			eventId,
			OR: [
				{ senderId: session.userId, receiverId: event.ownerId },
				{ senderId: event.ownerId, receiverId: session.userId },
			],
		},
		orderBy: { createdAt: "asc" },
	})

	// Mark unread messages as read
	await prisma.privateMessage.updateMany({
		where: {
			eventId,
			receiverId: session.userId,
			isRead: false,
		},
		data: { isRead: true },
	})

	return NextResponse.json({
		messages: messages.map((m) => ({
			id: m.id,
			content: m.content,
			senderId: m.senderId,
			createdAt: m.createdAt.toISOString(),
			isRead: m.isRead,
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
		select: { ownerId: true },
	})

	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	const body = (await request.json().catch(() => null)) as { 
		content?: string
		receiverId?: string 
	} | null

	if (!body?.content?.trim()) {
		return NextResponse.json({ error: "Content is required" }, { status: 400 })
	}

	// Determine receiver - if current user is owner, use receiverId from body
	// Otherwise, send to event owner
	let receiverId: string
	if (session.userId === event.ownerId) {
		// Owner is sending, need receiverId
		if (!body.receiverId) {
			return NextResponse.json({ error: "Receiver is required" }, { status: 400 })
		}
		receiverId = body.receiverId
	} else {
		// User is sending to owner
		receiverId = event.ownerId
	}

	const message = await prisma.privateMessage.create({
		data: {
			content: body.content.trim(),
			eventId,
			senderId: session.userId,
			receiverId,
		},
	})

	return NextResponse.json({
		message: {
			id: message.id,
			content: message.content,
			senderId: message.senderId,
			createdAt: message.createdAt.toISOString(),
			isRead: message.isRead,
		},
	}, { status: 201 })
}
