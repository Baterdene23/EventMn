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

// GET /api/admin/events - Get all events for admin (including drafts, cancelled, etc.)
export async function GET(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	if (!(await isAdmin(session.userId))) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 })
	}

	const { searchParams } = new URL(request.url)
	const status = searchParams.get("status")

	try {
		const events = await prisma.event.findMany({
			where: status ? { status: status as "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" } : undefined,
			include: {
				owner: {
					select: { id: true, name: true, email: true },
				},
				_count: {
					select: { attendees: true, likes: true },
				},
			},
			orderBy: { publishedAt: "desc" },
		})

		return NextResponse.json(events)
	} catch (error) {
		console.error("Get admin events error:", error)
		return NextResponse.json({ error: "Failed to get events" }, { status: 500 })
	}
}
