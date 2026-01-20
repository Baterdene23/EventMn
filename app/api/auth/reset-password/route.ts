import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { verifyOtp, hashPassword, type OtpPurpose } from "@/lib/auth/otp"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, code, newPassword } = body as {
			email?: string
			code?: string
			newPassword?: string
		}

		// Validation
		if (!email || !code || !newPassword) {
			return NextResponse.json(
				{ error: "Имэйл, код, шинэ нууц үг шаардлагатай" },
				{ status: 400 }
			)
		}

		if (newPassword.length < 8) {
			return NextResponse.json(
				{ error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой" },
				{ status: 400 }
			)
		}

		const normalizedEmail = email.toLowerCase().trim()

		// Check if user exists
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
		const purpose: OtpPurpose = "RESET_PASSWORD"
		const otpResult = await verifyOtp(normalizedEmail, purpose, code)

		if (!otpResult.valid) {
			return NextResponse.json(
				{ error: otpResult.error || "Буруу код" },
				{ status: 400 }
			)
		}

		// Hash new password and update
		const hashedPassword = await hashPassword(newPassword)

		await prisma.user.update({
			where: { email: normalizedEmail },
			data: { password: hashedPassword },
		})

		// Invalidate all existing sessions for security
		await prisma.session.deleteMany({
			where: { userId: user.id },
		})

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error("Reset password error:", error)
		return NextResponse.json(
			{ error: "Нууц үг сэргээхэд алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
