export type ThreadIdParts = {
	eventId: string
	otherUserId: string
}

export function formatThreadId(eventId: string, otherUserId: string): string {
	return `${eventId}--${otherUserId}`
}

export function getThreadIdCandidates(threadId: string): ThreadIdParts[] {
	const candidates: ThreadIdParts[] = []
	const seen = new Set<string>()

	function push(eventId: string, otherUserId: string) {
		const trimmedEventId = eventId.trim()
		const trimmedOtherUserId = otherUserId.trim()
		if (!trimmedEventId || !trimmedOtherUserId) return
		const key = `${trimmedEventId}|${trimmedOtherUserId}`
		if (seen.has(key)) return
		seen.add(key)
		candidates.push({ eventId: trimmedEventId, otherUserId: trimmedOtherUserId })
	}

	// Preferred format: {eventId}--{otherUserId}
	const doubleDashIndex = threadId.indexOf("--")
	if (doubleDashIndex !== -1) {
		push(threadId.slice(0, doubleDashIndex), threadId.slice(doubleDashIndex + 2))
	}

	// Legacy format: {eventId}_{otherUserId}
	// If otherUserId is seeded like usr_100, split at `_usr_` to avoid collisions.
	const usrIndex = threadId.indexOf("_usr_")
	if (usrIndex !== -1) {
		push(threadId.slice(0, usrIndex), threadId.slice(usrIndex + 1))
	}

	// Legacy public event ids like pub_001_{userId}
	const pubMatch = threadId.match(/^(pub_\d{3})_(.+)$/)
	if (pubMatch) {
		push(pubMatch[1], pubMatch[2])
	}

	// Generic fallback: try all underscore split points (bounded)
	let added = candidates.length
	for (let i = 0; i < threadId.length; i++) {
		if (threadId[i] !== "_") continue
		push(threadId.slice(0, i), threadId.slice(i + 1))
		if (candidates.length >= 12 && candidates.length > added) break
	}

	return candidates
}
