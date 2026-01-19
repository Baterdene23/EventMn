import type { ReactNode } from "react"
import { Footer } from "@/components/layout/Footer"

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col">
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
			<Footer />
		</div>
	)
}
