import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

// Notification-г уншсан болгох (readAt timestamp-тай)
export async function POST(req: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = await req.json()
	const { notificationId, markAll } = body

	try {
		const now = new Date()

		if (markAll) {
			// Бүх notification-г уншсан болгох
			await prisma.notification.updateMany({
				where: { userId: session.userId, isRead: false },
				data: { isRead: true, readAt: now },
			})
		} else if (notificationId) {
			// Ганц notification-г уншсан болгох
			await prisma.notification.updateMany({
				where: { id: notificationId, userId: session.userId },
				data: { isRead: true, readAt: now },
			})
		}
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
			return NextResponse.json({ ok: true })
		}
		throw error
	}

	return NextResponse.json({ ok: true })
}
