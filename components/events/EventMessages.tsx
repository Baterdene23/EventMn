"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type Message = {
	id: string
	content: string
	userId: string
	userName: string
	userAvatar?: string
	createdAt: string
}

type EventMessagesProps = {
	eventId: string
	isAuthed: boolean
	currentUserId?: string
}

export function EventMessages({ eventId, isAuthed, currentUserId }: EventMessagesProps) {
	const [messages, setMessages] = React.useState<Message[]>([])
	const [newMessage, setNewMessage] = React.useState("")
	const [sending, setSending] = React.useState(false)
	const [loading, setLoading] = React.useState(true)
	const messagesEndRef = React.useRef<HTMLDivElement>(null)

	// Scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}

	// Load initial messages
	React.useEffect(() => {
		async function loadMessages() {
			try {
				const res = await fetch(`/api/events/${eventId}/messages`)
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

	// Set up SSE for real-time updates
	React.useEffect(() => {
		const eventSource = new EventSource(`/api/events/${eventId}/messages/stream`)

		eventSource.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data) as Message
				setMessages((prev) => {
					// Avoid duplicates
					if (prev.some((m) => m.id === message.id)) return prev
					return [...prev, message]
				})
				scrollToBottom()
			} catch {
				// Ignore parse errors
			}
		}

		eventSource.onerror = () => {
			eventSource.close()
		}

		return () => {
			eventSource.close()
		}
	}, [eventId])

	// Scroll to bottom on initial load
	React.useEffect(() => {
		if (!loading && messages.length > 0) {
			scrollToBottom()
		}
	}, [loading, messages.length])

	async function handleSend(e: React.FormEvent) {
		e.preventDefault()
		if (!newMessage.trim() || sending) return

		setSending(true)
		try {
			const res = await fetch(`/api/events/${eventId}/messages`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ content: newMessage.trim() }),
			})

			if (res.ok) {
				setNewMessage("")
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
			<div className="border-b px-4 py-3">
				<h3 className="font-semibold">Нийтийн мессеж</h3>
				<p className="text-xs text-muted-foreground">
					Бүгд харах боломжтой
				</p>
			</div>

			{/* Messages container */}
			<div className="flex h-80 flex-col overflow-y-auto p-4">
				{loading ? (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-sm text-muted-foreground">Ачааллаж байна...</div>
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-center text-sm text-muted-foreground">
							<p>Одоогоор мессеж алга байна.</p>
							{isAuthed && <p className="mt-1">Эхний мессежээ бичээрэй!</p>}
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
										const isOwn = message.userId === currentUserId
										const initial = (message.userName?.trim()?.charAt(0) || "?").toUpperCase()
										return (
											<div
												key={message.id}
												className={cn(
													"flex gap-2",
													isOwn && "flex-row-reverse"
												)}
											>
												<Avatar className="h-8 w-8 shrink-0">
													<AvatarImage src={message.userAvatar} alt={message.userName} className="object-cover" />
													<AvatarFallback
														className={cn(
															"text-xs font-medium",
															isOwn
																? "bg-primary text-primary-foreground"
																: "bg-muted text-muted-foreground"
														)}
													>
														{initial}
													</AvatarFallback>
												</Avatar>
												<div
													className={cn(
														"max-w-[70%] rounded-2xl px-3 py-2",
														isOwn
															? "bg-primary text-primary-foreground"
															: "bg-muted"
													)}
												>
													{!isOwn && (
														<div className="mb-1 text-xs font-medium opacity-70">
															{message.userName}
														</div>
													)}
													<p className="text-sm">{message.content}</p>
													<div
														className={cn(
															"mt-1 text-[10px]",
															isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
														)}
													>
														{formatTime(message.createdAt)}
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
			{isAuthed ? (
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
			) : (
				<div className="border-t p-3 text-center text-sm text-muted-foreground">
					<a href="/login" className="text-primary hover:underline">
						Нэвтэрнэ үү
					</a>{" "}
					мессеж бичихийн тулд
				</div>
			)}
		</div>
	)
}
