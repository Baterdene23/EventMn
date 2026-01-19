import { NextResponse } from "next/server"

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
	const { userId } = await ctx.params
	return NextResponse.json({ user: { id: userId, name: "Demo User" } })
}

