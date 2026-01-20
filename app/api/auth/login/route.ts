import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { verifyPassword, createOtp, sendOtpEmail } from "@/lib/auth/otp"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, password } = body as {
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

		// Find user
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() },
		})

		if (!user) {
			return NextResponse.json(
				{ error: "Имэйл эсвэл нууц үг буруу байна" },
				{ status: 401 }
			)
		}

		// Check if password is hashed (bcrypt hashes start with $2)
		const isHashedPassword = user.password.startsWith("$2")
		let passwordValid = false

		if (isHashedPassword) {
			passwordValid = await verifyPassword(password, user.password)
		} else {
			// Legacy plain text password comparison
			passwordValid = user.password === password
		}

		if (!passwordValid) {
			return NextResponse.json(
				{ error: "Имэйл эсвэл нууц үг буруу байна" },
				{ status: 401 }
			)
		}

		// Check if 2FA is enabled
		if (user.twoFactorEnabled) {
			// Send OTP for 2FA
			const code = await createOtp(user.email, "LOGIN_2FA")
			await sendOtpEmail(user.email, code, "LOGIN_2FA")

			return NextResponse.json({
				ok: true,
				requiresOtp: true,
				email: user.email,
			})
		}

		// No 2FA - create session directly
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
		console.error("Login error:", error)
		return NextResponse.json(
			{ error: "Нэвтрэхэд алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
