import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { createEvent, getPublicEvents } from "@/lib/data/events"

export async function GET() {
	const events = await getPublicEvents()
	return NextResponse.json({ events })
}

export async function POST(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const body = (await request.json().catch(() => null)) as
		| {
				title?: string
				date?: string
				city?: string
				location?: string
				startAt?: string
				endAt?: string
				price?: number
				capacity?: number
				category?: string
				excerpt?: string
				imageSrc?: string
			}
		| null
	if (!body?.title?.trim()) {
		return NextResponse.json({ error: "Title is required" }, { status: 400 })
	}

	const event = await createEvent(session.userId, {
		title: body.title.trim(),
		date: String(body.date ?? ""),
		city: String(body.city ?? ""),
		location: body.location ? String(body.location) : undefined,
		startAt: body.startAt ? String(body.startAt) : undefined,
		endAt: body.endAt ? String(body.endAt) : undefined,
		price: typeof body.price === "number" ? body.price : undefined,
		capacity: typeof body.capacity === "number" ? body.capacity : undefined,
		category: String(body.category ?? ""),
		excerpt: body.excerpt ? String(body.excerpt) : "",
		imageSrc: body.imageSrc ? String(body.imageSrc) : undefined,
	})

	return NextResponse.json({ event }, { status: 201 })
}
