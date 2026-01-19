"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

type Message = {
	id: string
	content: string
	senderId: string
	createdAt: string
	isRead: boolean
}

type PrivateChatProps = {
	eventId: string
	currentUserId: string
	otherUser: {
		id: string
		name: string
		avatarUrl?: string
	}
}

export function PrivateChat({ eventId, currentUserId, otherUser }: PrivateChatProps) {
	const [messages, setMessages] = React.useState<Message[]>([])
	const [newMessage, setNewMessage] = React.useState("")
	const [sending, setSending] = React.useState(false)
	const [loading, setLoading] = React.useState(true)
	const messagesEndRef = React.useRef<HTMLDivElement>(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	// Load messages
	React.useEffect(() => {
		async function loadMessages() {
			try {
				const res = await fetch(`/api/events/${eventId}/private-messages`)
				if (res.ok) {
					const data = await res.json() as { messages: Message[] }
					setMessages(data.messages)
				}
			} catch {
				// Ignore errors
			} finally {
				setLoading(false)
			}
		}
		loadMessages()
	}, [eventId])

	// Poll for new messages every 3 seconds
	React.useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/events/${eventId}/private-messages`)
				if (res.ok) {
					const data = await res.json() as { messages: Message[] }
					setMessages(data.messages)
				}
			} catch {
				// Ignore errors
			}
		}, 3000)

		return () => clearInterval(interval)
	}, [eventId])

	// Scroll to bottom on messages change
	React.useEffect(() => {
		if (!loading) {
			scrollToBottom()
		}
	}, [loading, messages.length])

	async function handleSend(e: React.FormEvent) {
		e.preventDefault()
		if (!newMessage.trim() || sending) return

		setSending(true)
		try {
			const res = await fetch(`/api/events/${eventId}/private-messages`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ 
					content: newMessage.trim(),
					receiverId: otherUser.id,
				}),
			})

			if (res.ok) {
				const data = await res.json() as { message: Message }
				setMessages((prev) => [...prev, data.message])
				setNewMessage("")
				scrollToBottom()
			}
		} finally {
			setSending(false)
		}
	}

	function formatTime(dateString: string) {
		const date = new Date(dateString)
		return date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (date.toDateString() === today.toDateString()) {
			return "Өнөөдөр"
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Өчигдөр"
		}
		return date.toLocaleDateString("mn-MN", { month: "short", day: "numeric" })
	}

	// Group messages by date
	const groupedMessages = React.useMemo(() => {
		const groups: { date: string; messages: Message[] }[] = []
		let currentDate = ""

		for (const message of messages) {
			const messageDate = new Date(message.createdAt).toDateString()
			if (messageDate !== currentDate) {
				currentDate = messageDate
				groups.push({ date: message.createdAt, messages: [message] })
			} else {
				groups[groups.length - 1].messages.push(message)
			}
		}
		return groups
	}, [messages])

	return (
		<div className="flex flex-col rounded-xl border bg-card">
			{/* Other user header */}
			<div className="flex items-center gap-3 border-b px-4 py-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
					{otherUser.name.charAt(0).toUpperCase()}
				</div>
				<div>
					<div className="font-medium">{otherUser.name}</div>
					<div className="text-xs text-muted-foreground">Зохион байгуулагч</div>
				</div>
			</div>

			{/* Messages container */}
			<div className="flex h-[400px] flex-col overflow-y-auto p-4">
				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-sm text-muted-foreground">Ачааллаж байна...</div>
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-center text-sm text-muted-foreground">
							<p>Одоогоор мессеж алга байна.</p>
							<p className="mt-1">Эхний мессежээ бичээрэй!</p>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{groupedMessages.map((group) => (
							<div key={group.date}>
								<div className="mb-3 flex items-center gap-2">
									<div className="h-px flex-1 bg-border" />
									<span className="text-xs text-muted-foreground">
										{formatDate(group.date)}
									</span>
									<div className="h-px flex-1 bg-border" />
								</div>
								<div className="space-y-3">
									{group.messages.map((message) => {
										const isOwn = message.senderId === currentUserId
										return (
											<div
												key={message.id}
												className={cn(
													"flex gap-2",
													isOwn && "flex-row-reverse"
												)}
											>
												<div
													className={cn(
														"max-w-[75%] rounded-2xl px-4 py-2",
														isOwn
															? "bg-primary text-primary-foreground"
															: "bg-muted"
													)}
												>
													<p className="text-sm">{message.content}</p>
													<div
														className={cn(
															"mt-1 flex items-center gap-1 text-[10px]",
															isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
														)}
													>
														{formatTime(message.createdAt)}
														{isOwn && message.isRead && (
															<span className="ml-1">✓✓</span>
														)}
													</div>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input */}
			<form onSubmit={handleSend} className="border-t p-3">
				<div className="flex gap-2">
					<input
						type="text"
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						placeholder="Мессеж бичих..."
						className="flex-1 rounded-full border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						disabled={sending}
					/>
					<Button
						type="submit"
						size="icon"
						className="shrink-0 rounded-full"
						disabled={!newMessage.trim() || sending}
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</div>
	)
}
