"use client"

import type { TypingUser } from "@/lib/pusher/client"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
	typingUsers: TypingUser[]
	className?: string
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
	if (typingUsers.length === 0) return null

	const names = typingUsers.map((u) => u.userName || "Хэрэглэгч")
	let text: string

	if (names.length === 1) {
		text = `${names[0]} бичиж байна...`
	} else if (names.length === 2) {
		text = `${names[0]} болон ${names[1]} бичиж байна...`
	} else {
		text = `${names.length} хүн бичиж байна...`
	}

	return (
		<div
			className={cn(
				"flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground",
				className
			)}
		>
			{/* Animated dots */}
			<div className="flex gap-1">
				<span
					className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
					style={{ animationDelay: "0ms" }}
				/>
				<span
					className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
					style={{ animationDelay: "150ms" }}
				/>
				<span
					className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
					style={{ animationDelay: "300ms" }}
				/>
			</div>
			<span>{text}</span>
		</div>
	)
}
