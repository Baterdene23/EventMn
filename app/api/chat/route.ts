import { NextRequest, NextResponse } from "next/server"
import { handleChatMessage, checkRateLimit } from "@/lib/chatbot"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ChatRequestBody = {
  message: string
  sessionId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
    
    // Check rate limit
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Хэт олон хүсэлт илгээсэн байна. Түр хүлээнэ үү.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          }
        }
      )
    }

    // Parse request body
    const body = (await request.json()) as ChatRequestBody
    
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Мессеж шаардлагатай" },
        { status: 400 }
      )
    }

    // Validate message length
    const message = body.message.trim()
    if (message.length === 0) {
      return NextResponse.json(
        { error: "Мессеж хоосон байж болохгүй" },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Мессеж хэт урт байна (1000 тэмдэгтээс бага байх ёстой)" },
        { status: 400 }
      )
    }

    // Handle chat message
    const response = await handleChatMessage(message)

    return NextResponse.json(response, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      }
    })
  } catch (error) {
    console.error("Chat API error:", error)
    
    return NextResponse.json(
      { error: "Алдаа гарлаа. Дахин оролдоно уу." },
      { status: 500 }
    )
  }
}
