import Image from "next/image"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Message } from "./types"

interface MessageBubbleProps {
	message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
	return (
		<div
			className={cn(
				"flex gap-3",
				message.isOwn ? "flex-row-reverse" : "flex-row"
			)}
		>
			{/* Avatar - only show for other user's messages */}
			{!message.isOwn && (
				<div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
					{message.senderAvatar ? (
						<Image
							src={message.senderAvatar}
							alt={message.senderName || "User"}
							fill
							className="object-cover"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<User className="h-4 w-4 text-muted-foreground" />
						</div>
					)}
				</div>
			)}

			{/* Bubble */}
			<div
				className={cn(
					"max-w-[70%] rounded-2xl px-4 py-2",
					message.isOwn
						? "bg-primary text-primary-foreground"
						: "bg-muted"
				)}
			>
				<p className="whitespace-pre-wrap break-words text-sm">
					{message.content}
				</p>
				<p
					className={cn(
						"mt-1 text-xs",
						message.isOwn
							? "text-primary-foreground/70"
							: "text-muted-foreground"
					)}
				>
					{formatTime(message.createdAt)}
				</p>
			</div>
		</div>
	)
}

function formatTime(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleTimeString("mn-MN", {
		hour: "2-digit",
		minute: "2-digit",
	})
}
