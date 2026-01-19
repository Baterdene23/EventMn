import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, User } from "lucide-react"

interface ChatHeaderProps {
	otherUser: {
		id: string
		name: string | null
		avatarUrl: string | null
	}
	event: {
		id: string
		title: string
	}
	showBackButton?: boolean
}

export function ChatHeader({
	otherUser,
	event,
	showBackButton = true,
}: ChatHeaderProps) {
	return (
		<div className="flex items-center gap-4 border-b pb-4">
			{showBackButton && (
				<Link
					href="/dashboard/messages"
					className="rounded-full p-2 transition-colors hover:bg-muted md:hidden"
				>
					<ArrowLeft className="h-5 w-5" />
				</Link>
			)}

			<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
				{otherUser.avatarUrl ? (
					<Image
						src={otherUser.avatarUrl}
						alt={otherUser.name || "User"}
						fill
						className="object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<User className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">
					{otherUser.name || "Хэрэглэгч"}
				</p>
				<Link
					href={`/events/${event.id}`}
					className="truncate text-sm text-muted-foreground hover:underline"
				>
					{event.title}
				</Link>
			</div>
		</div>
	)
}
