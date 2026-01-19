// SSE endpoint for real-time message streaming

// Global store for SSE clients
declare global {
	var __messageClients: Map<string, Set<ReadableStreamDefaultController>> | undefined
}

if (!globalThis.__messageClients) {
	globalThis.__messageClients = new Map()
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	const { eventId } = await params

	const stream = new ReadableStream({
		start(controller) {
			// Add this client to the set of clients for this event
			if (!globalThis.__messageClients!.has(eventId)) {
				globalThis.__messageClients!.set(eventId, new Set())
			}
			globalThis.__messageClients!.get(eventId)!.add(controller)

			// Send initial connection message
			controller.enqueue(`: connected\n\n`)

			// Keep-alive ping every 30 seconds
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(`: ping\n\n`)
				} catch {
					clearInterval(pingInterval)
				}
			}, 30000)

			// Handle client disconnect
			request.signal.addEventListener("abort", () => {
				clearInterval(pingInterval)
				const clients = globalThis.__messageClients!.get(eventId)
				if (clients) {
					clients.delete(controller)
					if (clients.size === 0) {
						globalThis.__messageClients!.delete(eventId)
					}
				}
				try {
					controller.close()
				} catch {
					// Already closed
				}
			})
		},
	})

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive",
		},
	})
}
