"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"

export function LikeButton({
	eventId,
	isAuthed,
	initialLiked,
	className,
}: {
	eventId: string
	isAuthed: boolean
	initialLiked?: boolean
	className?: string
}) {
	const pathname = usePathname()
	const [liked, setLiked] = React.useState(!!initialLiked)
	const [pending, setPending] = React.useState(false)

	React.useEffect(() => {
		setLiked(!!initialLiked)
	}, [initialLiked])

	async function toggle(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault()
		e.stopPropagation()

		if (!isAuthed) {
			const returnTo = pathname || "/events"
			window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`
			return
		}

		if (pending) return
		setPending(true)
		try {
			const next = !liked
			setLiked(next)
			await fetch("/api/likes", {
				method: next ? "POST" : "DELETE",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ eventId }),
			})
		} finally {
			setPending(false)
		}
	}

	return (
		<button
			type="button"
			aria-label={liked ? "Unlike" : "Like"}
			title={liked ? "Unlike" : "Like"}
			onClick={toggle}
			disabled={pending}
			className={cn(
				"inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background/80 text-foreground backdrop-blur transition-colors",
				liked ? "text-rose-600" : "hover:bg-accent",
				pending ? "opacity-70" : "",
				className,
			)}
		>
			<Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
		</button>
	)
}
