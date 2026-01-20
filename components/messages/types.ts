export interface Message {
	id: string
	content: string
	senderId: string
	senderName: string | null
	senderAvatar: string | null
	createdAt: string
	isOwn: boolean
}

export interface Thread {
	threadId: string
	eventId: string
	eventTitle: string
	eventImage: string | null
	otherUser: {
		id: string
		name: string | null
		avatarUrl: string | null
	}
	lastMessage: string
	lastMessageAt: string
	unreadCount: number
}

export interface ThreadData {
	threadId: string
	currentUserId: string
	event: {
		id: string
		title: string
		imageSrc: string | null
	}
	otherUser: {
		id: string
		name: string | null
		avatarUrl: string | null
	}
	messages: Message[]
}
