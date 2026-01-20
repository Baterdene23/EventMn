"use client"

import PusherClient from "pusher-js"

// Client-side Pusher instance
// Uses NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER

let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient | null {
	if (typeof window === "undefined") return null

	const key = process.env.NEXT_PUBLIC_PUSHER_KEY
	const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

	if (!key || !cluster) return null

	if (!pusherClientInstance) {
		pusherClientInstance = new PusherClient(key, {
			cluster,
		})
	}

	return pusherClientInstance
}

// Typing user info
export type TypingUser = {
	userId: string
	userName: string
}

// Typing event data
export type TypingEvent = {
	userId: string
	userName: string
	isTyping: boolean
}
