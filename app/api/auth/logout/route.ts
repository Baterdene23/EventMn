import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"

export async function POST() {
	const cookieStore = await cookies()
	const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

	// Delete session from database
	if (sessionId) {
		await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
	}

	const response = NextResponse.json({ ok: true })
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	})
	return response
}
