import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	})
	return user?.role === "ADMIN"
}

// GET /api/admin/events/[eventId] - Get event details for admin
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	if (!(await isAdmin(session.userId))) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const { eventId } = await params

	try {
		const event = await prisma.event.findUnique({
			where: { id: eventId },
			include: {
				owner: {
					select: { id: true, name: true, email: true },
				},
				_count: {
					select: { attendees: true, likes: true },
				},
			},
		})

		if (!event) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 })
		}

		return NextResponse.json(event)
	} catch (error) {
		console.error("Get admin event error:", error)
		return NextResponse.json({ error: "Failed to get event" }, { status: 500 })
	}
}

// PATCH /api/admin/events/[eventId] - Approve/change event status
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	if (!(await isAdmin(session.userId))) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const { eventId } = await params

	try {
		const body = await request.json()
		const { status } = body as { status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" }

		if (!status || !["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"].includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status. Must be DRAFT, PUBLISHED, CANCELLED, or COMPLETED" },
				{ status: 400 }
			)
		}

		const event = await prisma.event.update({
			where: { id: eventId },
			data: {
				status,
				...(status === "PUBLISHED" && { publishedAt: new Date() }),
			},
		})

		return NextResponse.json(event)
	} catch (error) {
		console.error("Update admin event error:", error)
		return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
	}
}

// DELETE /api/admin/events/[eventId] - Delete event
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	if (!(await isAdmin(session.userId))) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const { eventId } = await params

	try {
		// Delete the event (cascades to likes and attendees)
		await prisma.event.delete({
			where: { id: eventId },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Delete admin event error:", error)
		return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
	}
}
