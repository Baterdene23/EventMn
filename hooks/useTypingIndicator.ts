"use client"

import * as React from "react"
import { getPusherClient, type TypingEvent, type TypingUser } from "@/lib/pusher/client"

const TYPING_TIMEOUT = 2000 // 2 seconds of inactivity = stopped typing

/**
 * Hook to manage typing indicator state
 * @param threadId - The thread/conversation ID
 * @param currentUserId - Current user's ID (to ignore own typing events)
 */
export function useTypingIndicator(threadId: string, currentUserId: string) {
	const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([])
	const [isTyping, setIsTyping] = React.useState(false)
	const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

	// Subscribe to typing events
	React.useEffect(() => {
		const pusher = getPusherClient()
		if (!pusher) return

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

		return () => {
			channel.unbind("typing")
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

	// Handle user typing
	const handleTyping = React.useCallback(() => {
		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}

		// Send typing start if not already typing
		if (!isTyping) {
			setIsTyping(true)
			sendTypingEvent(true)
		}

		// Set timeout to stop typing
		typingTimeoutRef.current = setTimeout(() => {
			setIsTyping(false)
			sendTypingEvent(false)
		}, TYPING_TIMEOUT)
	}, [isTyping, sendTypingEvent])

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
		}
	}, [])

	return {
		typingUsers,
		isTyping,
		handleTyping,
		stopTyping,
	}
}
