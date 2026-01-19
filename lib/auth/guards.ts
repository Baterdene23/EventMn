import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"

export async function requireUser({ returnTo }: { returnTo?: string } = {}) {
	const session = await getSession()
	if (!session) {
		const to = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
		redirect(`/login${to}`)
	}
	return session
}

