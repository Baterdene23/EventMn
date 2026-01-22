import type { ReactNode } from "react"

import { PublicAppBar } from "@/components/layout/PublicAppBar"
import { Footer } from "@/components/layout/Footer"
import { ChatWidget } from "@/components/chat"
import { getSession } from "@/lib/auth/session"

export default async function PublicLayout({ children }: { children: ReactNode }) {
	const session = await getSession()

	return (
		<div className="relative min-h-screen flex flex-col">
			<div className="pointer-events-none absolute inset-0 bg-gradient-subtle bg-grid-pattern" />
			<div className="relative flex min-h-screen flex-col">
				<PublicAppBar isAuthed={!!session} userAvatarUrl={session?.userAvatarUrl} />
				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
				<Footer />
			</div>
			<ChatWidget />
		</div>
	)
}
