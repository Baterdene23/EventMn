import { NextResponse } from "next/server"

export async function GET() {
	return NextResponse.json({ users: [{ id: "usr_001", name: "Demo User" }] })
}

