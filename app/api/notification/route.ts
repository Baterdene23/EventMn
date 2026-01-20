import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

// Хэрэглэгчийн бүх notification-г авах (MESSAGE төрлийг хасах - message badge дээр харуулна)
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const notifications = await prisma.notification.findMany({
			where: {
				userId: session.userId,
				type: { not: "MESSAGE" }, // MESSAGE төрлийг хасах
			},
			orderBy: { createdAt: "desc" },
			take: 50,
		})

		// Unread count - MESSAGE төрлийг хасах
		const unreadCount = await prisma.notification.count({
			where: {
				userId: session.userId,
				readAt: null,
				type: { not: "MESSAGE" },
			},
		})

		return NextResponse.json({ notifications, unreadCount })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
			return NextResponse.json({ notifications: [], unreadCount: 0 })
		}
		throw error
	}
}
