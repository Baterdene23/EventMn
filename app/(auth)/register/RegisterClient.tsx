"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function RegisterClient({ returnTo }: { returnTo?: string }) {
	const router = useRouter()
	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const formData = new FormData(e.currentTarget)
			const name = String(formData.get("name") ?? "")
			const email = String(formData.get("email") ?? "")
			const password = String(formData.get("password") ?? "")
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			})
			const data = await res.json()
			if (!res.ok) {
				setError(data.error || "Бүртгэхэд алдаа гарлаа")
				return
			}
				if (data.requiresOtp && data.email) {
				sessionStorage.setItem("verify_email", data.email)
				router.push(`/verify?email=${encodeURIComponent(data.email)}`)
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
					<h1 className=" text-2xl font-semibold tracking-tight">Бүртгүүлэх</h1>
					<p className="text-sm text-muted-foreground">Шинэ account үүсгэнэ.</p>
				</div>

				<form className="mt-6 space-y-3" onSubmit={onSubmit}>
					{error && (
						<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</div>
					)}
					<Input label="Нэр" name="name" placeholder="Таны нэр" />
					<Input label="Имэйл" name="email" type="email" placeholder="you@example.com" required />
					<Input label="Нууц үг" name="password" type="password" placeholder="Нууц үг" minLength={8} required />
					<Button className="w-full" type="submit" disabled={loading}>
						{loading ? "Бүртгэж байна…" : "Бүртгүүлэх"}
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					<span className="text-muted-foreground">Аль хэдийн account-тэй юу?</span>{" "}
					<Link className="hover:underline" href="/login">
						Нэвтрэх
					</Link>
				</div>
			</div>
		</div>
	)
}
