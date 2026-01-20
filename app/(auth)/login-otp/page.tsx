"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/Button"
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
	InputOTPSeparator,
} from "@/components/ui/input-otp"

function LoginOtpContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [otp, setOtp] = React.useState("")
	const [email, setEmail] = React.useState("")

	// Get email from query param or sessionStorage
	React.useEffect(() => {
		const emailParam = searchParams.get("email")
		if (emailParam) {
			setEmail(emailParam)
			sessionStorage.setItem("login_2fa_email", emailParam)
		} else {
			const storedEmail = sessionStorage.getItem("login_2fa_email")
			if (storedEmail) {
				setEmail(storedEmail)
			}
		}
	}, [searchParams])

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		if (!email) {
			setError("Имэйл хаяг олдсонгүй. Дахин нэвтэрнэ үү.")
			setLoading(false)
			return
		}

		if (otp.length !== 6) {
			setError("6 оронтой код оруулна уу")
			setLoading(false)
			return
		}

		try {
			const res = await fetch("/api/auth/login-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code: otp }),
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error || "Алдаа гарлаа")
				return
			}

			// Clear stored email
			sessionStorage.removeItem("login_2fa_email")

			// Redirect to dashboard
			router.push("/dashboard")
			router.refresh()
		} catch {
			setError("Сүлжээний алдаа гарлаа")
		} finally {
			setLoading(false)
		}
	}

	async function resendOtp() {
		if (!email) return

		setLoading(true)
		setError(null)

		try {
			const res = await fetch("/api/auth/send-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, purpose: "LOGIN_2FA" }),
			})

			if (res.ok) {
				alert("Шинэ код илгээлээ!")
			}
		} catch {
			setError("Код дахин илгээхэд алдаа гарлаа")
		} finally {
			setLoading(false)
		}
	}

	// Auto-submit when OTP is complete
	React.useEffect(() => {
		if (otp.length === 6) {
			const form = document.querySelector("form")
			if (form) {
				form.requestSubmit()
			}
		}
	}, [otp])

	return (
		<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
			<div className="rounded-2xl border bg-card p-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Хоёр шатлалт баталгаажуулалт</h1>
					<p className="text-sm text-muted-foreground">
						Имэйлээр ирсэн 6 оронтой кодыг оруулна уу.
					</p>
				</div>

				<form className="mt-6 space-y-4" onSubmit={onSubmit}>
					{error && (
						<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}

					{email && (
						<div className="rounded-md bg-muted px-3 py-2 text-sm">
							Код илгээсэн имэйл: <strong>{email}</strong>
						</div>
					)}

					<div className="space-y-2">
						<label className="text-sm font-medium">Баталгаажуулах код</label>
						<div className="flex justify-center">
							<InputOTP
								maxLength={6}
								value={otp}
								onChange={setOtp}
								autoFocus
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>

					<Button className="w-full" type="submit" disabled={loading}>
						{loading ? "Шалгаж байна..." : "Баталгаажуулах"}
					</Button>
				</form>

				<div className="mt-4 flex items-center justify-between text-sm">
					<button
						type="button"
						onClick={resendOtp}
						className="text-muted-foreground hover:underline"
						disabled={loading}
					>
						Код дахин илгээх
					</button>
					<Link className="text-muted-foreground hover:underline" href="/login">
						Буцах
					</Link>
				</div>
			</div>
		</div>
	)
}

export default function LoginOtpPage() {
	return (
		<React.Suspense fallback={
			<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
				<div className="rounded-2xl border bg-card p-6">
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				</div>
			</div>
		}>
			<LoginOtpContent />
		</React.Suspense>
	)
}
