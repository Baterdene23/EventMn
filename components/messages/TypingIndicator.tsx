"use client"

import type { TypingUser } from "@/lib/pusher/client"
import type { MessageStreamEvent } from "@/hooks/useTypingIndicator"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
	typingUsers: TypingUser[]
	streamingMessage?: MessageStreamEvent | null
	className?: string
}

export function TypingIndicator({ typingUsers, streamingMessage, className }: TypingIndicatorProps) {
	// If we have streaming content, show that instead of just "typing..."
	if (streamingMessage && streamingMessage.content) {
		return (
			<div
				className={cn(
					"flex flex-col gap-1 rounded-lg bg-muted/50 px-4 py-3 text-sm",
					className
				)}
			>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<div className="flex gap-1">
						<span
							className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
							style={{ animationDelay: "0ms" }}
						/>
						<span
							className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
							style={{ animationDelay: "150ms" }}
						/>
						<span
							className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
							style={{ animationDelay: "300ms" }}
						/>
					</div>
					<span>{streamingMessage.userName || "Хэрэглэгч"} бичиж байна</span>
				</div>
				<div className="text-foreground/80 italic">
					{streamingMessage.content}
				</div>
			</div>
		)
	}

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
