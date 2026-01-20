"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ForgetPasswordPage() {
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const [success, setSuccess] = React.useState(false)

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError(null)

		const formData = new FormData(e.currentTarget)
		const email = String(formData.get("email") ?? "").trim()

		if (!email) {
			setError("Имэйл хаяг оруулна уу")
			setLoading(false)
			return
		}

		try {
			const res = await fetch("/api/auth/send-otp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, purpose: "RESET_PASSWORD" }),
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error || "Алдаа гарлаа")
				return
			}

			// Store email in sessionStorage for reset-password page
			sessionStorage.setItem("reset_email", email)
			setSuccess(true)

			// Redirect to reset-password page after short delay
			setTimeout(() => {
				router.push("/reset-password")
			}, 1500)
		} catch {
			setError("Сүлжээний алдаа гарлаа")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
			<div className="rounded-2xl border bg-card p-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Нууц үг сэргээх</h1>
					<p className="text-sm text-muted-foreground">
						Имэйлээ оруулаад баталгаажуулах код авах.
					</p>
				</div>

				{success ? (
					<div className="mt-6 rounded-md bg-green-500/10 px-4 py-3 text-center text-sm text-green-600">
						Баталгаажуулах код илгээлээ! Имэйлээ шалгана уу.
					</div>
				) : (
					<form className="mt-6 space-y-3" onSubmit={onSubmit}>
						{error && (
							<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</div>
						)}
						<Input
							label="Имэйл"
							name="email"
							type="email"
							placeholder="you@example.com"
							required
						/>
						<Button className="w-full" type="submit" disabled={loading}>
							{loading ? "Илгээж байна..." : "Код илгээх"}
						</Button>
					</form>
				)}

				<div className="mt-4 text-center text-sm">
					<Link className="text-muted-foreground hover:underline" href="/login">
						Нэвтрэх рүү буцах
					</Link>
				</div>
			</div>
		</div>
	)
}
