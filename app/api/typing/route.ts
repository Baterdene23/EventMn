import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { triggerTyping } from "@/lib/pusher/server"

export async function POST(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = await request.json()
	const { threadId, isTyping } = body as {
		threadId?: string
		isTyping?: boolean
	}

	if (!threadId) {
		return NextResponse.json({ error: "threadId шаардлагатай" }, { status: 400 })
	}

	const success = await triggerTyping(
		threadId,
		session.userId,
		session.userName || "Хэрэглэгч",
		isTyping ?? false
	)

	if (!success) {
		// Pusher not configured - just return ok (graceful degradation)
		return NextResponse.json({ ok: true, pusher: false })
	}

	return NextResponse.json({ ok: true })
}
