"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import { MessageCircle } from "lucide-react"

import {
	ChatHeader,
	MessageBubble,
	MessageInput,
	EmptyState,
	TypingIndicator,
	type Message,
	type ThreadData,
} from "@/components/messages"
import { useTypingIndicator } from "@/hooks/useTypingIndicator"

export default function ChatThreadPage({
	params,
}: {
	params: Promise<{ threadId: string }>
}) {
	const [threadId, setThreadId] = useState<string | null>(null)
	const [threadData, setThreadData] = useState<ThreadData | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Handle new real-time message
	const handleNewMessage = useCallback((message: Message) => {
		setMessages((prev) => {
			// Avoid duplicates
			if (prev.some((m) => m.id === message.id)) return prev
			return [...prev, { ...message, isOwn: false }]
		})
	}, [])

	// Handle real-time message deletion
	const handleMessageDeleted = useCallback((messageId: string) => {
		setMessages((prev) => prev.filter((m) => m.id !== messageId))
	}, [])

	// Typing indicator hook with real-time message support
	const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(
		threadId || "",
		threadData?.currentUserId || "",
		handleNewMessage,
		handleMessageDeleted
	)

	// Resolve params
	useEffect(() => {
		params.then((p) => setThreadId(p.threadId))
	}, [params])

	// Fetch initial data
	useEffect(() => {
		if (!threadId) return

		async function fetchThread() {
			try {
				const res = await fetch(`/api/messages/${threadId}`)
				if (res.ok) {
					const data: ThreadData = await res.json()
					setThreadData(data)
					setMessages(data.messages)
					setError(null)
				} else {
					const errData = await res.json()
					setError(errData.error || "Мессеж олдсонгүй")
				}
			} catch (err) {
				console.error("Failed to fetch thread:", err)
				setError("Сервертэй холбогдож чадсангүй")
			} finally {
				setLoading(false)
			}
		}
		fetchThread()
	}, [threadId])

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const handleSendMessage = useCallback(
		async (content: string) => {
			if (!threadId) return

			// Stop typing indicator when sending
			stopTyping()

			const res = await fetch(`/api/messages/${threadId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			})

			if (res.ok) {
				const msg: Message = await res.json()
				setMessages((prev) => {
					if (prev.some((m) => m.id === msg.id)) return prev
					return [...prev, msg]
				})
			}
		},
		[threadId, stopTyping]
	)

	const handleDeleteMessage = useCallback(
		async (messageId: string) => {
			if (!threadId) return

			const res = await fetch(`/api/messages/${threadId}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messageId }),
			})

			if (res.ok) {
				setMessages((prev) => prev.filter((m) => m.id !== messageId))
			}
		},
		[threadId]
	)

	if (loading) {
		return (
			<div className="flex h-[60vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
	}

	if (error || !threadData) {
		return (
			<div className="rounded-2xl border bg-card p-8">
				<EmptyState
					icon={MessageCircle}
					title={error || "Мессеж олдсонгүй"}
					description="Эхлүүлэхийн тулд мессеж илгээнэ үү"
				/>
				<div className="mt-4 text-center">
					<Link
						href="/dashboard/messages"
						className="text-sm text-primary hover:underline"
					>
						Бүх мессежүүд рүү буцах
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border bg-card">
			{/* Header */}
			<div className="p-4">
				<ChatHeader
					otherUser={threadData.otherUser}
					event={threadData.event}
					showBackButton={true}
				/>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4">
				<div className="space-y-4">
					{messages.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							Эхлүүлэхийн тулд мессеж илгээнэ үү
						</p>
					) : (
						messages.map((message) => (
							<MessageBubble
								key={message.id}
								message={message}
								onDelete={handleDeleteMessage}
							/>
						))
					)}
					{/* Typing indicator */}
					<TypingIndicator typingUsers={typingUsers} />
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input */}
			<div className="p-4">
				<MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
			</div>
		</div>
	)
}
