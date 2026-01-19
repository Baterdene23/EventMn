import { NextResponse } from "next/server"

export async function POST(_req: Request, _ctx: { params: Promise<{ eventId: string }> }) {
	return NextResponse.json(
		{ error: "Not implemented", message: "Admin publish endpoint is not implemented in this demo." },
		{ status: 501 },
	)
}

