"use client"

import Image from "next/image"
import { useState } from "react"
import { User, Trash2, MoreVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Message } from "./types"

interface MessageBubbleProps {
	message: Message
	onDelete?: (messageId: string) => void
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
	const [isDeleting, setIsDeleting] = useState(false)

	async function handleDelete() {
		if (!onDelete || isDeleting) return
		setIsDeleting(true)
		onDelete(message.id)
	}

	return (
		<div
			className={cn(
				"group flex gap-3",
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
			<div className="flex items-center gap-1">
				{/* Delete menu - only for own messages, shown on hover */}
				{message.isOwn && onDelete && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className="rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
								aria-label="Мессеж цэс"
							>
								<MoreVertical className="h-4 w-4 text-muted-foreground" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{isDeleting ? "Устгаж байна..." : "Устгах"}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}

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
