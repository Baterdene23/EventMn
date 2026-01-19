import Link from "next/link"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function ForgetPasswordPage() {
	return (
		<div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col justify-center px-4 py-10">
			<div className="rounded-2xl border bg-card p-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">Нууц үг сэргээх</h1>
					<p className="text-sm text-muted-foreground">
						Имэйлээ оруулаад сэргээх холбоос авах.
					</p>
				</div>

				<form className="mt-6 space-y-3">
					<Input label="Имэйл" name="email" type="email" placeholder="you@example.com" />
					<Button className="w-full" type="submit">
						Сэргээх холбоос илгээх
					</Button>
				</form>

				<div className="mt-4 text-center text-sm">
					<Link className="text-muted-foreground hover:underline" href="/login">
						Нэвтрэх рүү буцах
					</Link>
				</div>
			</div>
		</div>
	)
}

