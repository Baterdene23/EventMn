import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export async function POST(request: Request) {
	try {
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const { enabled } = body as { enabled?: boolean }

		if (typeof enabled !== "boolean") {
			return NextResponse.json(
				{ error: "enabled талбар шаардлагатай" },
				{ status: 400 }
			)
		}

		await prisma.user.update({
			where: { id: session.userId },
			data: { twoFactorEnabled: enabled },
		})

		return NextResponse.json({ ok: true, twoFactorEnabled: enabled })
	} catch (error) {
		console.error("Toggle 2FA error:", error)
		return NextResponse.json(
			{ error: "2FA тохируулахад алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
