import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name, email, password } = body as {
			name?: string
			email?: string
			password?: string
		}

		// Validation
		if (!email || !password) {
			return NextResponse.json(
				{ error: "Имэйл болон нууц үг шаардлагатай" },
				{ status: 400 }
			)
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой" },
				{ status: 400 }
			)
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		})

		if (existingUser) {
			return NextResponse.json(
				{ error: "Энэ имэйл хаягаар бүртгэлтэй хэрэглэгч байна" },
				{ status: 400 }
			)
		}

		// Create user with plain password
		const user = await prisma.user.create({
			data: {
				email: email.toLowerCase(),
				name: name || null,
				password,
			},
		})

		// Create session
		const session = await prisma.session.create({
			data: {
				userId: user.id,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		})

		const response = NextResponse.json({ ok: true, userId: user.id })
		response.cookies.set({
			name: SESSION_COOKIE_NAME,
			value: session.id,
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7, // 7 days
		})

		return response
	} catch (error) {
		console.error("Register error:", error)
		return NextResponse.json(
			{ error: "Бүртгэл үүсгэхэд алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
