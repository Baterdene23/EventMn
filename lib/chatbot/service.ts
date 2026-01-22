/**
 * Chatbot Service - Main orchestration
 */

import { callGemini, callGeminiJSON } from "./gemini"
import {
  INTENT_EXTRACTION_SYSTEM,
  ANSWER_GENERATION_SYSTEM,
  FAQ_DATA,
  buildIntentPrompt,
  buildAnswerPrompt,
} from "./prompts"
import { searchEventsForChat, type ChatEventResult } from "./search"

export type ChatIntent = {
  intent: "search_event" | "recommend_event" | "help_eventmn" | "greeting" | "other"
  city: string | null
  date_range: string | null
  category: string | null
  keywords: string[]
  price_max: number | null
  free_only: boolean
}

export type ChatResponse = {
  reply: string
  events?: ChatEventResult[]
  intent?: string
}

/**
 * Extract intent from user message using Gemini
 */
async function extractIntent(message: string): Promise<ChatIntent> {
  try {
    const prompt = buildIntentPrompt(message)
    const intent = await callGeminiJSON<ChatIntent>(prompt, INTENT_EXTRACTION_SYSTEM)
    
    // Apply defaults
    return {
      intent: intent.intent || "other",
      city: intent.city ?? "ulaanbaatar",
      date_range: intent.date_range ?? "next_14_days",
      category: intent.category ?? null,
      keywords: intent.keywords || [],
      price_max: intent.price_max ?? null,
      free_only: intent.free_only ?? false,
    }
  } catch (error) {
    console.error("Intent extraction error:", error)
    // Fallback to default intent
    return {
      intent: "search_event",
      city: "ulaanbaatar",
      date_range: "next_14_days",
      category: null,
      keywords: [],
      price_max: null,
      free_only: false,
    }
  }
}

/**
 * Get help response for EventMN usage questions
 */
function getHelpResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  // Эвент үүсгэх - олон хувилбар
  if (
    lowerMessage.includes("эвент үүсгэх") ||
    lowerMessage.includes("эвент нэмэх") ||
    lowerMessage.includes("event үүсгэх") ||
    lowerMessage.includes("event uusgeh") ||
    lowerMessage.includes("create event") ||
    lowerMessage.includes("шинэ эвент") ||
    lowerMessage.includes("яаж эвент") ||
    lowerMessage.includes("хэрхэн эвент") ||
    (lowerMessage.includes("эвент") && lowerMessage.includes("үүсгэ")) ||
    (lowerMessage.includes("event") && lowerMessage.includes("үүсгэ"))
  ) {
    return FAQ_DATA.create_event
  }
  
  // Профайл засах - олон хувилбар  
  if (
    lowerMessage.includes("профайл") ||
    lowerMessage.includes("profile") ||
    lowerMessage.includes("хувийн мэдээлэл") ||
    lowerMessage.includes("нэр солих") ||
    lowerMessage.includes("зураг солих") ||
    lowerMessage.includes("профайл засах") ||
    lowerMessage.includes("profile zasah")
  ) {
    return FAQ_DATA.profile
  }
  
  // Бүртгэл
  if (
    (lowerMessage.includes("бүртгүүлэх") && !lowerMessage.includes("эвент")) ||
    lowerMessage.includes("register") ||
    lowerMessage.includes("шинэ хаяг") ||
    lowerMessage.includes("хэрхэн бүртгүүлэх") ||
    lowerMessage.includes("яаж бүртгүүлэх")
  ) {
    return FAQ_DATA.register
  }
  
  // Нэвтрэх / Нууц үг
  if (
    lowerMessage.includes("нэвтрэх") ||
    lowerMessage.includes("login") ||
    lowerMessage.includes("нууц үг") ||
    lowerMessage.includes("password")
  ) {
    return FAQ_DATA.login
  }
  
  // Гарах
  if (lowerMessage.includes("гарах") || lowerMessage.includes("logout")) {
    return FAQ_DATA.logout
  }
  
  // Аюулгүй байдал / 2FA
  if (
    lowerMessage.includes("2fa") ||
    lowerMessage.includes("аюулгүй") ||
    lowerMessage.includes("security") ||
    lowerMessage.includes("authenticator")
  ) {
    return FAQ_DATA.security
  }
  
  // Сонирхол
  if (lowerMessage.includes("сонирхол") || lowerMessage.includes("interest")) {
    return FAQ_DATA.interests
  }
  
  // Эвент засах
  if (
    lowerMessage.includes("эвент засах") ||
    lowerMessage.includes("эвент өөрчлөх") ||
    lowerMessage.includes("edit event") ||
    lowerMessage.includes("засварлах")
  ) {
    return FAQ_DATA.edit_event
  }
  
  // Эвент устгах
  if (
    lowerMessage.includes("эвент устгах") ||
    lowerMessage.includes("delete event") ||
    lowerMessage.includes("устгах")
  ) {
    return FAQ_DATA.delete_event
  }
  
  // Эвент нийтлэх
  if (
    lowerMessage.includes("нийтлэх") ||
    lowerMessage.includes("publish") ||
    lowerMessage.includes("draft")
  ) {
    return FAQ_DATA.publish_event
  }
  
  // Organizer
  if (
    lowerMessage.includes("organizer") ||
    lowerMessage.includes("зохион байгуулагч")
  ) {
    return FAQ_DATA.organizer
  }
  
  // Тасалбар / Бүртгүүлэх
  if (
    lowerMessage.includes("тасалбар") ||
    lowerMessage.includes("ticket") ||
    (lowerMessage.includes("эвент") && lowerMessage.includes("бүртгүүлэх"))
  ) {
    return FAQ_DATA.ticket
  }
  
  // Эвент хайх
  if (
    lowerMessage.includes("хайх") ||
    lowerMessage.includes("search") ||
    lowerMessage.includes("шүүлтүүр") ||
    lowerMessage.includes("filter")
  ) {
    return FAQ_DATA.search_event
  }
  
  // Мессеж
  if (
    lowerMessage.includes("мессеж") ||
    lowerMessage.includes("message") ||
    (lowerMessage.includes("чат") && !lowerMessage.includes("чатбот")) ||
    lowerMessage.includes("холбогдох")
  ) {
    return FAQ_DATA.messages
  }
  
  // Холбоо барих
  if (
    lowerMessage.includes("холбоо барих") ||
    lowerMessage.includes("contact") ||
    lowerMessage.includes("support") ||
    lowerMessage.includes("тусламж")
  ) {
    return FAQ_DATA.contact
  }
  
  // Ерөнхий
  if (
    lowerMessage.includes("eventmn") ||
    lowerMessage.includes("юу вэ") ||
    lowerMessage.includes("яаж ашиглах") ||
    lowerMessage.includes("ямар боломж")
  ) {
    return FAQ_DATA.general
  }
  
  return null
}

/**
 * Generate final response using Gemini
 */
async function generateResponse(
  userMessage: string,
  events: ChatEventResult[],
  intent: ChatIntent
): Promise<string> {
  // For help intent, try FAQ first
  if (intent.intent === "help_eventmn") {
    const helpResponse = getHelpResponse(userMessage)
    if (helpResponse) {
      return helpResponse
    }
  }

  // Use Gemini to generate response
  const prompt = buildAnswerPrompt(userMessage, events, intent.intent)
  const response = await callGemini(prompt, ANSWER_GENERATION_SYSTEM)
  
  return response
}

/**
 * Main chat handler
 */
export async function handleChatMessage(message: string): Promise<ChatResponse> {
  // Step 0: Check if this is a help question first (skip Gemini call)
  const helpResponse = getHelpResponse(message)
  if (helpResponse) {
    return {
      reply: helpResponse,
      intent: "help_eventmn",
    }
  }

  // Step 1: Extract intent
  const intent = await extractIntent(message)
  
  // Step 2: Handle based on intent
  let events: ChatEventResult[] = []
  
  if (intent.intent === "search_event" || intent.intent === "recommend_event") {
    // Search events from database (limit to 3)
    events = await searchEventsForChat({
      city: intent.city,
      date_range: intent.date_range,
      category: intent.category,
      keywords: intent.keywords,
      price_max: intent.price_max,
      free_only: intent.free_only,
      limit: 3,
    })
  }
  
  // Step 3: Generate response
  const reply = await generateResponse(message, events, intent)
  
  return {
    reply,
    events: events.length > 0 ? events : undefined,
    intent: intent.intent,
  }
}
