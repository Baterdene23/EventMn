/**
 * Typing Indicator Implementation Guide
 * 
 * This file provides snippets for implementing real-time typing indicators
 * using Pusher (recommended for Next.js serverless) or Socket.io.
 * 
 * Typing indicators are NOT stored in the database - they are ephemeral events
 * that only live in the real-time channel.
 */

// ============================================
// OPTION 1: PUSHER (Recommended for Vercel/Serverless)
// ============================================

/**
 * Installation:
 * pnpm add pusher pusher-js
 * 
 * Environment variables needed in .env:
 * PUSHER_APP_ID=your_app_id
 * PUSHER_KEY=your_key
 * PUSHER_SECRET=your_secret
 * PUSHER_CLUSTER=your_cluster
 * NEXT_PUBLIC_PUSHER_KEY=your_key
 * NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
 */

// --- lib/pusher/server.ts ---
export const pusherServerExample = `
import Pusher from "pusher"

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})
`

// --- lib/pusher/client.ts ---
export const pusherClientExample = `
import PusherClient from "pusher-js"

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)
`

// --- app/api/typing/route.ts ---
export const typingApiRouteExample = `
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { pusher } from "@/lib/pusher/server"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId, isTyping } = await request.json()

  // Trigger typing event to conversation channel
  await pusher.trigger(
    \`conversation-\${conversationId}\`,
    "typing",
    {
      userId: session.userId,
      userName: session.userName,
      isTyping,
    }
  )

  return NextResponse.json({ ok: true })
}
`

// --- components/chat/TypingIndicator.tsx ---
export const typingIndicatorComponentExample = `
"use client"

import * as React from "react"
import { pusherClient } from "@/lib/pusher/client"

type TypingUser = {
  userId: string
  userName: string | null
}

type TypingIndicatorProps = {
  conversationId: string
  currentUserId: string
}

export function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([])

  React.useEffect(() => {
    const channel = pusherClient.subscribe(\`conversation-\${conversationId}\`)

    channel.bind("typing", (data: { userId: string; userName: string; isTyping: boolean }) => {
      // Ignore own typing events
      if (data.userId === currentUserId) return

      setTypingUsers((prev) => {
        if (data.isTyping) {
          // Add user if not already in list
          if (!prev.some((u) => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }]
          }
          return prev
        } else {
          // Remove user from list
          return prev.filter((u) => u.userId !== data.userId)
        }
      })
    })

    return () => {
      pusherClient.unsubscribe(\`conversation-\${conversationId}\`)
    }
  }, [conversationId, currentUserId])

  if (typingUsers.length === 0) return null

  const names = typingUsers.map((u) => u.userName || "Хэрэглэгч").join(", ")
  const text = typingUsers.length === 1
    ? \`\${names} бичиж байна...\`
    : \`\${names} нар бичиж байна...\`

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{text}</span>
    </div>
  )
}
`

// --- hooks/useTypingIndicator.ts ---
export const useTypingIndicatorHookExample = `
"use client"

import * as React from "react"

const TYPING_TIMEOUT = 2000 // Stop typing after 2 seconds of inactivity

export function useTypingIndicator(conversationId: string) {
  const [isTyping, setIsTyping] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const sendTypingEvent = React.useCallback(async (typing: boolean) => {
    try {
      await fetch("/api/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, isTyping: typing }),
      })
    } catch {
      // Ignore errors
    }
  }, [conversationId])

  const handleTyping = React.useCallback(() => {
    // Send typing start if not already typing
    if (!isTyping) {
      setIsTyping(true)
      sendTypingEvent(true)
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingEvent(false)
    }, TYPING_TIMEOUT)
  }, [isTyping, sendTypingEvent])

  const stopTyping = React.useCallback(() => {
    if (isTyping) {
      setIsTyping(false)
      sendTypingEvent(false)
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [isTyping, sendTypingEvent])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { handleTyping, stopTyping, isTyping }
}
`

// --- Usage in MessageInput component ---
export const messageInputUsageExample = `
"use client"

import * as React from "react"
import { useTypingIndicator } from "@/hooks/useTypingIndicator"

type MessageInputProps = {
  conversationId: string
  onSend: (content: string) => Promise<void>
}

export function MessageInput({ conversationId, onSend }: MessageInputProps) {
  const [content, setContent] = React.useState("")
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value)
    handleTyping() // Trigger typing indicator
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    stopTyping() // Stop typing indicator before sending
    await onSend(content)
    setContent("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={handleChange}
        onBlur={stopTyping}
        placeholder="Мессеж бичих..."
        className="flex-1 rounded-md border px-3 py-2"
      />
      <button type="submit" className="rounded-md bg-primary px-4 py-2 text-white">
        Илгээх
      </button>
    </form>
  )
}
`

// ============================================
// OPTION 2: SOCKET.IO (For custom server setups)
// ============================================

/**
 * Socket.io requires a custom server setup which doesn't work well with
 * Vercel serverless. Only use this if you have a custom Node.js server.
 * 
 * Installation:
 * pnpm add socket.io socket.io-client
 */

export const socketIoServerExample = `
// server.ts (custom server)
import { createServer } from "http"
import { Server } from "socket.io"
import next from "next"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res))
  const io = new Server(server, {
    cors: { origin: "*" }
  })

  io.on("connection", (socket) => {
    // Join conversation room
    socket.on("join-conversation", (conversationId: string) => {
      socket.join(\`conversation:\${conversationId}\`)
    })

    // Leave conversation room
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(\`conversation:\${conversationId}\`)
    })

    // Handle typing events
    socket.on("typing", (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      socket.to(\`conversation:\${data.conversationId}\`).emit("typing", {
        userId: data.userId,
        userName: data.userName,
        isTyping: data.isTyping,
      })
    })
  })

  server.listen(3000, () => {
    console.log("> Ready on http://localhost:3000")
  })
})
`

export const socketIoClientExample = `
// lib/socket.ts
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000")
  }
  return socket
}

// Usage in component
const socket = getSocket()
socket.emit("join-conversation", conversationId)
socket.on("typing", (data) => {
  // Handle typing event
})
`

// ============================================
// SUMMARY
// ============================================

/**
 * RECOMMENDED APPROACH: Pusher
 * 
 * Pros:
 * - Works with Vercel serverless
 * - Easy to set up
 * - Free tier available (200k messages/day)
 * - Built-in presence channels for online status
 * 
 * Cons:
 * - External dependency
 * - Pricing for high volume
 * 
 * ALTERNATIVE: Socket.io
 * 
 * Pros:
 * - Self-hosted
 * - More control
 * - No external costs
 * 
 * Cons:
 * - Requires custom server
 * - Doesn't work with Vercel serverless
 * - More complex setup
 */
