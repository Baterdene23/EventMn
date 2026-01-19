"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MessageCircle } from "lucide-react"

import {
	ConversationItem,
	ConversationListSkeleton,
	ChatHeader,
	MessageBubble,
	MessageInput,
	EmptyState,
	type Thread,
	type Message,
	type ThreadData,
} from "@/components/messages"
import { cn } from "@/lib/utils"

export default function DashboardMessagesPage() {
	const [threads, setThreads] = useState<Thread[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
	const [threadData, setThreadData] = useState<ThreadData | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [chatLoading, setChatLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Fetch thread list
	useEffect(() => {
		async function fetchThreads() {
			try {
				const res = await fetch("/api/messages")
				if (res.ok) {
					const data = await res.json()
					setThreads(data.threads)
				}
			} catch (error) {
				console.error("Failed to fetch threads:", error)
			} finally {
				setLoading(false)
			}
		}
		fetchThreads()
	}, [])

	// Fetch selected thread data
	useEffect(() => {
		if (!selectedThreadId) {
			setThreadData(null)
			setMessages([])
			return
		}

		async function fetchThread() {
			setChatLoading(true)
			try {
				const res = await fetch(`/api/messages/${selectedThreadId}`)
				if (res.ok) {
					const data: ThreadData = await res.json()
					setThreadData(data)
					setMessages(data.messages)
				}
			} catch (err) {
				console.error("Failed to fetch thread:", err)
			} finally {
				setChatLoading(false)
			}
		}
		fetchThread()
	}, [selectedThreadId])

	// Poll for new messages
	useEffect(() => {
		if (!selectedThreadId || chatLoading) return

		const pollInterval = setInterval(async () => {
			try {
				const lastMessage = messages[messages.length - 1]
				const lastTime = lastMessage ? new Date(lastMessage.createdAt).getTime() : 0

				const res = await fetch(`/api/messages/${selectedThreadId}/stream?lastId=${lastTime}`)
				if (res.ok) {
					const data = await res.json()
					if (data.messages && data.messages.length > 0) {
						setMessages((prev) => {
							const newMsgs = data.messages.filter(
								(m: Message) => !prev.some((p) => p.id === m.id)
							)
							return [...prev, ...newMsgs]
						})
					}
				}
			} catch {
				// Ignore polling errors
			}
		}, 3000)

		return () => clearInterval(pollInterval)
	}, [selectedThreadId, chatLoading, messages])

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const handleSendMessage = useCallback(
		async (content: string) => {
			if (!selectedThreadId) return

			const res = await fetch(`/api/messages/${selectedThreadId}`, {
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

				// Update thread list with new last message
				setThreads((prev) =>
					prev.map((t) =>
						t.threadId === selectedThreadId
							? { ...t, lastMessage: content, lastMessageAt: new Date().toISOString() }
							: t
					)
				)
			}
		},
		[selectedThreadId]
	)

	const handleSelectThread = (threadId: string) => {
		setSelectedThreadId(threadId)
	}

	return (
		<div className="flex h-[calc(100vh-10rem)] flex-col md:flex-row gap-0 overflow-hidden rounded-2xl border bg-card">
			{/* Conversation List - Left Side */}
			<div
				className={cn(
					"w-full border-b md:w-80 md:border-b-0 md:border-r",
					selectedThreadId ? "hidden md:block" : "block"
				)}
			>
				<div className="border-b p-4">
					<h1 className="text-lg font-semibold">Мессежүүд</h1>
					<p className="text-sm text-muted-foreground">
						Таны хувийн мессеж
					</p>
				</div>

				<div className="h-[calc(100%-5rem)] overflow-y-auto">
					{loading ? (
						<ConversationListSkeleton />
					) : threads.length === 0 ? (
						<EmptyState
							icon={MessageCircle}
							title="Мессеж байхгүй"
							description="Эвент зохион байгуулагчтай холбогдохын тулд эвентийн хуудаснаас мессеж илгээнэ үү"
						/>
					) : (
						<div className="divide-y">
							{threads.map((thread) => (
								<div
									key={thread.threadId}
									onClick={() => handleSelectThread(thread.threadId)}
									className="cursor-pointer"
								>
									<ConversationItem
										thread={thread}
										isActive={thread.threadId === selectedThreadId}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Chat Area - Right Side */}
			<div
				className={cn(
					"flex flex-1 flex-col",
					selectedThreadId ? "block" : "hidden md:flex"
				)}
			>
				{!selectedThreadId ? (
					<EmptyState
						icon={MessageCircle}
						title="Мессеж сонгоно уу"
						description="Зүүн талаас мессеж сонгож харна уу"
					/>
				) : chatLoading ? (
					<div className="flex h-full items-center justify-center">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				) : threadData ? (
					<>
						{/* Chat Header */}
						<div className="p-4">
							<div
								onClick={() => setSelectedThreadId(null)}
								className="cursor-pointer md:cursor-default"
							>
								<ChatHeader
									otherUser={threadData.otherUser}
									event={threadData.event}
									showBackButton={true}
								/>
							</div>
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
										<MessageBubble key={message.id} message={message} />
									))
								)}
								<div ref={messagesEndRef} />
							</div>
						</div>

						{/* Input */}
						<div className="p-4">
							<MessageInput onSend={handleSendMessage} />
						</div>
					</>
				) : (
					<EmptyState
						icon={MessageCircle}
						title="Мессеж олдсонгүй"
						description="Энэ мессеж олдсонгүй"
					/>
				)}
			</div>
		</div>
	)
}
