import Image from "next/image"
import Link from "next/link"
import { User } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Thread } from "./types"

interface ConversationItemProps {
	thread: Thread
	isActive?: boolean
}

export function ConversationItem({ thread, isActive = false }: ConversationItemProps) {
	return (
		<Link
			href={`/dashboard/messages/${thread.threadId}`}
			className={cn(
				"flex items-center gap-3 p-3 transition-colors hover:bg-muted/50",
				isActive && "bg-muted"
			)}
		>
			{/* Avatar */}
			<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
				{thread.otherUser.avatarUrl ? (
					<Image
						src={thread.otherUser.avatarUrl}
						alt={thread.otherUser.name || "User"}
						fill
						className="object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<User className="h-6 w-6 text-muted-foreground" />
					</div>
				)}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<p className="truncate font-medium">
						{thread.otherUser.name || "Хэрэглэгч"}
					</p>
					<span className="shrink-0 text-xs text-muted-foreground">
						{formatRelativeTime(thread.lastMessageAt)}
					</span>
				</div>
				<p className="truncate text-sm text-muted-foreground">
					{thread.eventTitle}
				</p>
				<p
					className={cn(
						"mt-0.5 truncate text-sm",
						thread.unreadCount > 0
							? "font-medium text-foreground"
							: "text-muted-foreground"
					)}
				>
					{thread.lastMessage}
				</p>
			</div>

			{/* Unread badge */}
			{thread.unreadCount > 0 && (
				<div className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
					{thread.unreadCount}
				</div>
			)}
		</Link>
	)
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	if (diffInSeconds < 60) return "Саяхан"
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин`
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} цаг`
	if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} өдөр`

	return date.toLocaleDateString("mn-MN", { month: "short", day: "numeric" })
}
