import { NextResponse } from "next/server"

import { verifyOtp, type OtpPurpose } from "@/lib/auth/otp"

const VALID_PURPOSES: OtpPurpose[] = ["RESET_PASSWORD", "LOGIN_2FA", "VERIFY_EMAIL"]

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, code, purpose } = body as {
			email?: string
			code?: string
			purpose?: OtpPurpose
		}

		// Validation
		if (!email || !code) {
			return NextResponse.json(
				{ error: "Имэйл болон код шаардлагатай" },
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

		// Verify OTP
		const result = await verifyOtp(normalizedEmail, purpose, code)

		if (!result.valid) {
			return NextResponse.json(
				{ error: result.error || "Буруу код" },
				{ status: 400 }
			)
		}

		return NextResponse.json({ ok: true, verified: true })
	} catch (error) {
		console.error("Verify OTP error:", error)
		return NextResponse.json(
			{ error: "OTP шалгахад алдаа гарлаа" },
			{ status: 500 }
		)
	}
}
