import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

// Хэрэглэгчийн бүх notification-г авах
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const notifications = await prisma.notification.findMany({
			where: { userId: session.userId },
			orderBy: { createdAt: "desc" },
			take: 50,
		})

		const unreadCount = await prisma.notification.count({
			where: { userId: session.userId, isRead: false },
		})

		return NextResponse.json({ notifications, unreadCount })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
			return NextResponse.json({ notifications: [], unreadCount: 0 })
		}
		throw error
	}
}
