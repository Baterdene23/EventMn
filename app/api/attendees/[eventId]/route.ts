import { NextResponse } from "next/server"

export async function GET(_req: Request, ctx: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await ctx.params
	return NextResponse.json({ eventId, attendees: [] })
}

