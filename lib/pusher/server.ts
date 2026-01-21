import Pusher from "pusher"

// Server-side Pusher instance
// Configure these in .env:
// PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER

let pusherInstance: Pusher | null = null

export function getPusher(): Pusher | null {
	if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
		return null
	}

	if (!pusherInstance) {
		pusherInstance = new Pusher({
			appId: process.env.PUSHER_APP_ID,
			key: process.env.PUSHER_KEY,
			secret: process.env.PUSHER_SECRET,
			cluster: process.env.PUSHER_CLUSTER || "ap1",
			useTLS: true,
		})
	}

	return pusherInstance
}

// Helper to trigger typing event
export async function triggerTyping(
	threadId: string,
	userId: string,
	userName: string,
	isTyping: boolean
): Promise<boolean> {
	const pusher = getPusher()
	if (!pusher) return false

	try {
		await pusher.trigger(`thread-${threadId}`, "typing", {
			userId,
			userName,
			isTyping,
		})
		return true
	} catch (error) {
		console.error("Pusher trigger error:", error)
		return false
	}
}

// Helper to trigger new message event
export async function triggerNewMessage(
	threadId: string,
	message: {
		id: string
		content: string
		senderId: string
		senderName: string | null
		senderAvatar: string | null
		createdAt: Date
	}
): Promise<boolean> {
	const pusher = getPusher()
	if (!pusher) return false

	try {
		await pusher.trigger(`thread-${threadId}`, "new-message", message)
		return true
	} catch (error) {
		console.error("Pusher trigger error:", error)
		return false
	}
}

// Helper to trigger badge update for a specific user
export async function triggerBadgeUpdate(userId: string): Promise<boolean> {
	const pusher = getPusher()
	if (!pusher) return false

	try {
		await pusher.trigger(`user-${userId}`, "badge-update", {
			timestamp: Date.now(),
		})
		return true
	} catch (error) {
		console.error("Pusher badge trigger error:", error)
		return false
	}
}

// Helper to trigger message streaming (typing with content preview)
export async function triggerMessageStream(
	threadId: string,
	userId: string,
	userName: string,
	content: string
): Promise<boolean> {
	const pusher = getPusher()
	if (!pusher) return false

	try {
		await pusher.trigger(`thread-${threadId}`, "message-stream", {
			userId,
			userName,
			content,
		})
		return true
	} catch (error) {
		console.error("Pusher stream trigger error:", error)
		return false
	}
}
