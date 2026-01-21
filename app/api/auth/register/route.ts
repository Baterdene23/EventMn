import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { createOtp, sendOtpEmail } from "@/lib/auth/otp"

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

		const normalizedEmail = email.toLowerCase()

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		})

		if (existingUser) {
			// If user exists but not verified, resend OTP
			if (!existingUser.emailVerified) {
				const code = await createOtp(normalizedEmail, "VERIFY_EMAIL")
				await sendOtpEmail(normalizedEmail, code, "VERIFY_EMAIL")
				return NextResponse.json({
					ok: true,
					requireVerification: true,
					email: normalizedEmail,
					message: "Баталгаажуулах код дахин илгээлээ",
				})
			}
			return NextResponse.json(
				{ error: "Энэ имэйл хаягаар бүртгэлтэй хэрэглэгч байна" },
				{ status: 400 }
			)
		}

		// Create user with plain password (emailVerified = false by default)
		const user = await prisma.user.create({
			data: {
				email: normalizedEmail,
				name: name || null,
				password,
				emailVerified: false,
			},
		})

		// Create and send OTP for email verification
		const code = await createOtp(user.email, "VERIFY_EMAIL")
		const emailResult = await sendOtpEmail(user.email, code, "VERIFY_EMAIL")
		
		if (!emailResult.success) {
			// Delete user if email fails (so they can try again)
			await prisma.user.delete({ where: { id: user.id } })
			return NextResponse.json(
				{ error: emailResult.error || "Имэйл илгээхэд алдаа гарлаа" },
				{ status: 500 }
			)
		}

		// Don't create session - require email verification first
		return NextResponse.json({
			ok: true,
			requireVerification: true,
			email: normalizedEmail,
			message: "Бүртгэл амжилттай. Имэйлээр илгээсэн кодоор баталгаажуулна уу.",
		})
	} catch (error) {
		console.error("Register error:", error)
		return NextResponse.json(
			{ error: "Бүртгэл үүсгэхэд алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
