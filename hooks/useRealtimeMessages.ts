"use client"

import * as React from "react"
import { getPusherClient } from "@/lib/pusher/client"
import type { Message } from "@/components/messages"

/**
 * Hook to subscribe to real-time messages via Pusher
 * @param conversationId - The conversation ID to subscribe to
 * @param onNewMessage - Callback when a new message arrives
 */
export function useRealtimeMessages(
	conversationId: string | null,
	onNewMessage: (message: Message) => void
) {
	const onNewMessageRef = React.useRef(onNewMessage)

	// Keep callback ref updated
	React.useEffect(() => {
		onNewMessageRef.current = onNewMessage
	}, [onNewMessage])

	React.useEffect(() => {
		if (!conversationId) return

		const pusher = getPusherClient()
		if (!pusher) {
			console.warn("Pusher client not available")
			return
		}

		const channelName = `conversation-${conversationId}`
		const channel = pusher.subscribe(channelName)

		channel.bind("new-message", (data: Message) => {
			onNewMessageRef.current(data)
		})

		return () => {
			channel.unbind("new-message")
			pusher.unsubscribe(channelName)
		}
	}, [conversationId])
}
