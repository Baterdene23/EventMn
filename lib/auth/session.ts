import { cookies } from "next/headers"

import { prisma } from "@/lib/db/client"

export const SESSION_COOKIE_NAME = "eventmn_session" as const

export type Session = {
	userId: string
	userName?: string
	userAvatarUrl?: string
	userRole?: string
}

export async function getSession(): Promise<Session | null> {
	const cookieStore = await cookies()
	const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
	if (!sessionId) return null

	try {
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
			include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
		})

		if (!session) return null

		// Check if session is expired
		if (session.expiresAt < new Date()) {
			// Delete expired session
			await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
			return null
		}

		return {
			userId: session.userId,
			userName: session.user.name ?? undefined,
			userAvatarUrl: session.user.avatarUrl ?? undefined,
			userRole: session.user.role,
		}
	} catch {
		return null
	}
}
