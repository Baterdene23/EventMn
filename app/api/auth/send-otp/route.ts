import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { createOtp, sendOtpEmail, type OtpPurpose } from "@/lib/auth/otp"

const VALID_PURPOSES: OtpPurpose[] = ["RESET_PASSWORD", "LOGIN_2FA", "VERIFY_EMAIL"]

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, purpose } = body as {
			email?: string
			purpose?: OtpPurpose
		}

		// Validation
		if (!email) {
			return NextResponse.json(
				{ error: "Имэйл хаяг шаардлагатай" },
				{ status: 400 }
			)
		}

		if (!purpose || !VALID_PURPOSES.includes(purpose)) {
			return NextResponse.json(
				{ error: "Буруу purpose утга" },
				{ status: 400 }
			)
		}

		const normalizedEmail = email.toLowerCase().trim()

		// For RESET_PASSWORD and LOGIN_2FA, check if user exists
		if (purpose === "RESET_PASSWORD" || purpose === "LOGIN_2FA") {
			const user = await prisma.user.findUnique({
				where: { email: normalizedEmail },
			})

			if (!user) {
				// Don't reveal whether email exists (security)
				// Still return success to prevent email enumeration
				return NextResponse.json({ ok: true })
			}
		}

		// Generate OTP code
		const code = await createOtp(normalizedEmail, purpose)

		// Send email
		const emailResult = await sendOtpEmail(normalizedEmail, code, purpose)

		if (!emailResult.success) {
			return NextResponse.json(
				{ error: emailResult.error || "Имэйл илгээхэд алдаа гарлаа" },
				{ status: 500 }
			)
		}

		return NextResponse.json({ ok: true })
	} catch (error) {
		console.error("Send OTP error:", error)
		const message = error instanceof Error ? error.message : "Unknown error"
		return NextResponse.json(
			{ error: "OTP илгээхэд алдаа гарлаа", details: message },
			{ status: 500 }
		)
	}
}
