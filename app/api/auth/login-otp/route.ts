import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { verifyOtp, type OtpPurpose } from "@/lib/auth/otp"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, code } = body as {
			email?: string
			code?: string
		}

		// Validation
		if (!email || !code) {
			return NextResponse.json(
				{ error: "Имэйл болон код шаардлагатай" },
				{ status: 400 }
			)
		}

		const normalizedEmail = email.toLowerCase().trim()

		// Find user
		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		})

		if (!user) {
			return NextResponse.json(
				{ error: "Хэрэглэгч олдсонгүй" },
				{ status: 404 }
			)
		}

		// Verify OTP
		const purpose: OtpPurpose = "LOGIN_2FA"
		const otpResult = await verifyOtp(normalizedEmail, purpose, code)

		if (!otpResult.valid) {
			return NextResponse.json(
				{ error: otpResult.error || "Буруу код" },
				{ status: 400 }
			)
		}

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
		console.error("Login OTP error:", error)
		return NextResponse.json(
			{ error: "OTP баталгаажуулахад алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
