"use client"

import * as React from "react"
import { getPusherClient, type TypingEvent, type TypingUser } from "@/lib/pusher/client"
import type { Message } from "@/components/messages"

const TYPING_TIMEOUT = 2000 // 2 seconds of inactivity = stopped typing
const STREAM_DEBOUNCE = 100 // Debounce streaming to avoid too many requests

// Message stream event type
export type MessageStreamEvent = {
	userId: string
	userName: string
	content: string
}

/**
 * Hook to manage typing indicator state and real-time messages
 * @param threadId - The thread/conversation ID
 * @param currentUserId - Current user's ID (to ignore own typing events)
 * @param onNewMessage - Optional callback when a new message arrives
 * @param onMessageDeleted - Optional callback when a message is deleted
 * @param enableStreaming - Enable message content streaming (default: true)
 */
export function useTypingIndicator(
	threadId: string,
	currentUserId: string,
	onNewMessage?: (message: Message) => void,
	onMessageDeleted?: (messageId: string) => void,
	enableStreaming = true
) {
	const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([])
	const [streamingMessage, setStreamingMessage] = React.useState<MessageStreamEvent | null>(null)
	const [isTyping, setIsTyping] = React.useState(false)
	const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
	const streamTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
	const lastStreamRef = React.useRef<number>(0)
	const onNewMessageRef = React.useRef(onNewMessage)
	const onMessageDeletedRef = React.useRef(onMessageDeleted)

	// Keep callback refs updated
	React.useEffect(() => {
		onNewMessageRef.current = onNewMessage
		onMessageDeletedRef.current = onMessageDeleted
	}, [onNewMessage, onMessageDeleted])

	// Subscribe to typing events, new messages, and message deletions
	React.useEffect(() => {
		const pusher = getPusherClient()
		// Wait until we have valid threadId and currentUserId
		if (!pusher || !threadId || !currentUserId) return

		const channel = pusher.subscribe(`thread-${threadId}`)

		channel.bind("typing", (data: TypingEvent) => {
			// Ignore own typing events
			if (data.userId === currentUserId) return

			setTypingUsers((prev) => {
				if (data.isTyping) {
					// Add user if not already in list
					if (prev.some((u) => u.userId === data.userId)) return prev
					return [...prev, { userId: data.userId, userName: data.userName }]
				} else {
					// Remove user from list
					return prev.filter((u) => u.userId !== data.userId)
				}
			})
		})

		// Listen for message streaming
		channel.bind("message-stream", (data: MessageStreamEvent) => {
			// Ignore own stream events
			if (data.userId === currentUserId) return
			
			setStreamingMessage(data)
			
			// Clear streaming message after timeout (user stopped typing)
			if (streamTimeoutRef.current) {
				clearTimeout(streamTimeoutRef.current)
			}
			streamTimeoutRef.current = setTimeout(() => {
				setStreamingMessage(null)
			}, TYPING_TIMEOUT * 2)
		})

		// Listen for new messages
		channel.bind("new-message", (data: Message) => {
			// Ignore own messages (already added optimistically)
			if (data.senderId === currentUserId) return
			
			// Clear streaming message when actual message arrives
			setStreamingMessage(null)
			
			if (onNewMessageRef.current) {
				onNewMessageRef.current(data)
			}
		})

		// Listen for message deletions
		channel.bind("message-deleted", (data: { messageId: string }) => {
			if (onMessageDeletedRef.current) {
				onMessageDeletedRef.current(data.messageId)
			}
		})

		return () => {
			channel.unbind("typing")
			channel.unbind("message-stream")
			channel.unbind("new-message")
			channel.unbind("message-deleted")
			pusher.unsubscribe(`thread-${threadId}`)
		}
	}, [threadId, currentUserId])

	// Clear stale typing users after timeout
	React.useEffect(() => {
		if (typingUsers.length === 0) return

		const timeout = setTimeout(() => {
			setTypingUsers([])
		}, TYPING_TIMEOUT * 2)

		return () => clearTimeout(timeout)
	}, [typingUsers])

	// Send typing event to server
	const sendTypingEvent = React.useCallback(
		async (typing: boolean) => {
			if (!threadId) return
			try {
				await fetch("/api/typing", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ threadId, isTyping: typing }),
				})
			} catch {
				// Ignore errors
			}
		},
		[threadId]
	)

	// Send message stream event to server (debounced)
	const sendStreamEvent = React.useCallback(
		async (content: string) => {
			if (!threadId || !enableStreaming) return
			
			const now = Date.now()
			if (now - lastStreamRef.current < STREAM_DEBOUNCE) return
			lastStreamRef.current = now
			
			try {
				await fetch("/api/typing", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ threadId, streamContent: content }),
				})
			} catch {
				// Ignore errors
			}
		},
		[threadId, enableStreaming]
	)

	// Handle user typing (with optional content for streaming)
	const handleTyping = React.useCallback((content?: string) => {
		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}

		// Send typing start if not already typing
		if (!isTyping) {
			setIsTyping(true)
			sendTypingEvent(true)
		}

		// Send stream content if enabled and content provided
		if (enableStreaming && content !== undefined) {
			sendStreamEvent(content)
		}

		// Set timeout to stop typing
		typingTimeoutRef.current = setTimeout(() => {
			setIsTyping(false)
			sendTypingEvent(false)
		}, TYPING_TIMEOUT)
	}, [isTyping, sendTypingEvent, sendStreamEvent, enableStreaming])

	// Stop typing immediately (e.g., on message send)
	const stopTyping = React.useCallback(() => {
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}
		if (isTyping) {
			setIsTyping(false)
			sendTypingEvent(false)
		}
	}, [isTyping, sendTypingEvent])

	// Cleanup on unmount
	React.useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}
			if (streamTimeoutRef.current) {
				clearTimeout(streamTimeoutRef.current)
			}
		}
	}, [])

	return {
		typingUsers,
		streamingMessage,
		isTyping,
		handleTyping,
		stopTyping,
	}
}
