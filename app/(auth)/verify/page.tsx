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

function VerifyContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [success, setSuccess] = React.useState(false)
	const [otp, setOtp] = React.useState("")
	const [email, setEmail] = React.useState("")

	// Get email from query param or sessionStorage
	React.useEffect(() => {
		const emailParam = searchParams.get("email")
		if (emailParam) {
			setEmail(emailParam)
			sessionStorage.setItem("verify_email", emailParam)
		} else {
			const storedEmail = sessionStorage.getItem("verify_email")
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
			setError("Имэйл хаяг олдсонгүй")
			setLoading(false)
			return
		}

		if (otp.length !== 6) {
			setError("6 оронтой код оруулна уу")
			setLoading(false)
			return
		}

		try {
			const res = await fetch("/api/auth/verify-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code: otp, purpose: "VERIFY_EMAIL" }),
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error || "Алдаа гарлаа")
				return
			}

			sessionStorage.removeItem("verify_email")
			setSuccess(true)

			setTimeout(() => {
				router.push("/login")
			}, 2000)
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
				body: JSON.stringify({ email, purpose: "VERIFY_EMAIL" }),
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

	if (success) {
		return (
			<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
				<div className="rounded-2xl border bg-card p-6">
					<div className="rounded-md bg-green-500/10 px-4 py-3 text-center text-sm text-green-600">
						Имэйл амжилттай баталгаажлаа! Нэвтрэх хуудас руу шилжүүлж байна...
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
			<div className="rounded-2xl border bg-card p-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Имэйл баталгаажуулах</h1>
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
						Нэвтрэх рүү буцах
					</Link>
				</div>
			</div>
		</div>
	)
}

export default function VerifyPage() {
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
			<VerifyContent />
		</React.Suspense>
	)
}
