import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const { eventId } = await params

	const event = await prisma.event.findUnique({
		where: { id: eventId },
	})

	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	return NextResponse.json({ event })
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const { eventId } = await params
	const session = await getSession()

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	// Check if user owns this event
	const event = await prisma.event.findUnique({
		where: { id: eventId },
	})

	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	if (event.ownerId !== session.userId) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const body = (await request.json().catch(() => null)) as {
		title?: string
		excerpt?: string
		description?: string
		date?: string
		city?: string
		location?: string
		startAt?: string
		endAt?: string
		price?: number
		category?: string
		imageSrc?: string
		status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"
		isOnline?: boolean
		meetingUrl?: string | null
	} | null

	if (!body) {
		return NextResponse.json({ error: "Invalid body" }, { status: 400 })
	}

	const updatedEvent = await prisma.event.update({
		where: { id: eventId },
		data: {
			...(body.title !== undefined && { title: body.title }),
			...(body.excerpt !== undefined && { excerpt: body.excerpt }),
			...(body.description !== undefined && { description: body.description }),
			...(body.date !== undefined && { date: body.date }),
			...(body.city !== undefined && { city: body.city }),
			...(body.location !== undefined && { location: body.location }),
			...(body.startAt !== undefined && { startAt: body.startAt ? new Date(body.startAt) : null }),
			...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
			...(body.price !== undefined && { price: body.price }),
			...(body.category !== undefined && { category: body.category }),
			...(body.imageSrc !== undefined && { imageSrc: body.imageSrc }),
			...(body.status !== undefined && { status: body.status }),
			...(body.isOnline !== undefined && { isOnline: body.isOnline }),
			...(body.meetingUrl !== undefined && { meetingUrl: body.meetingUrl }),
		},
	})

	return NextResponse.json({ event: updatedEvent })
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const { eventId } = await params
	const session = await getSession()

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	// Check if user owns this event
	const event = await prisma.event.findUnique({
		where: { id: eventId },
	})

	if (!event) {
		return NextResponse.json({ error: "Event not found" }, { status: 404 })
	}

	if (event.ownerId !== session.userId) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	await prisma.event.delete({
		where: { id: eventId },
	})

	return NextResponse.json({ ok: true, message: "Event deleted" })
}
