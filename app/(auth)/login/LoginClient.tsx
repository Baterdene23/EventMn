"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function LoginClient({ returnTo }: { returnTo?: string }) {
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const formData = new FormData(e.currentTarget)
			const email = String(formData.get("email") ?? "")
			const password = String(formData.get("password") ?? "")
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email, password }),
			})
			const data = await res.json()
			if (!res.ok) {
				setError(data.error || "Нэвтрэхэд алдаа гарлаа")
				return
			}

			// Check if 2FA is required
			if (data.requiresOtp) {
				// Store email for OTP page
				sessionStorage.setItem("login_2fa_email", data.email)
				router.push(`/login-otp?email=${encodeURIComponent(data.email)}`)
				return
			}

			router.push(returnTo || "/dashboard")
			router.refresh()
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
					<h1 className="text-2xl font-semibold tracking-tight">Нэвтрэх</h1>
					<p className="text-sm text-muted-foreground">Таны эвентүүдийг удирдах хэсэг рүү орно.</p>
				</div>

				<form className="mt-6 space-y-3" onSubmit={onSubmit}>
					{error && (
						<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}
					<Input label="Имэйл" name="email" type="email" placeholder="you@example.com" required />
					<Input label="Нууц үг" name="password" type="password" placeholder="••••••••" minLength={8} required />
					<Button className="w-full" type="submit" disabled={loading}>
						{loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
					</Button>
					
				</form>
				<div className="mt-4 flex items-center justify-between text-sm">
					<Link className="text-muted-foreground hover:underline" href="/forget-password">
						Нууц үг мартсан?
					</Link>
					<Link className="text-muted-foreground hover:underline" href="/register">
						Бүртгүүлэх
					</Link>
				</div>
			</div>
		</div>
	)
}
