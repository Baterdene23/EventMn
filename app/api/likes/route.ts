import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { getLikedEventIds, likeEvent, unlikeEvent } from "@/lib/data/likes"

export async function GET() {
	const session = await getSession()
	if (!session) return NextResponse.json({ likedEventIds: [] })
	const likedEventIds = await getLikedEventIds(session.userId)
	return NextResponse.json({ likedEventIds })
}

export async function POST(req: Request) {
	const session = await getSession()
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

	const body = (await req.json().catch(() => null)) as { eventId?: string } | null
	const eventId = body?.eventId
	if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

	await likeEvent(session.userId, eventId)
	return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
	const session = await getSession()
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

	const body = (await req.json().catch(() => null)) as { eventId?: string } | null
	const eventId = body?.eventId
	if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

	await unlikeEvent(session.userId, eventId)
	return NextResponse.json({ ok: true })
}
