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
  specific_month: number | null
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
      city: intent.city ?? null,  // Don't default to any city - search all
      date_range: intent.date_range ?? (intent.specific_month ? null : null),  // Don't default - search all dates
      specific_month: intent.specific_month ?? null,
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
      city: null,
      date_range: null,
      specific_month: null,
      category: null,
      keywords: [],
      price_max: null,
      free_only: false,
    }
  }
}

/**
 * Synonym patterns for semantic matching
 * Each key maps to an array of synonyms/similar phrases
 */
const SYNONYM_PATTERNS: Record<string, string[]> = {
  // Эвент үүсгэх
  create_event: [
    "эвент үүсгэх", "эвент нэмэх", "event үүсгэх", "event uusgeh", "create event",
    "шинэ эвент", "яаж эвент", "хэрхэн эвент", "арга хэмжээ нэмэх", "арга хэмжээ үүсгэх",
    "event хийх", "эвент хийх", "зохион байгуулах", "өөрийн эвент", "event nemeh",
    "add event", "new event", "эвент бүртгэх", "шинээр нэмэх", "ивент нэмэх",
    "ивент үүсгэх", "арга хэмжээ зохион байгуулах"
  ],
  
  // Профайл
  profile: [
    "профайл", "profile", "хувийн мэдээлэл", "нэр солих", "зураг солих",
    "профайл засах", "profile zasah", "миний мэдээлэл", "өөрийн мэдээлэл",
    "аккаунт", "account", "миний хуудас", "тохиргоо", "settings", "bio",
    "танилцуулга", "профиль", "хэрэглэгчийн мэдээлэл"
  ],
  
  // Бүртгэл
  register: [
    "бүртгүүлэх", "register", "шинэ хаяг", "хэрхэн бүртгүүлэх", "яаж бүртгүүлэх",
    "sign up", "signup", "данс үүсгэх", "хаяг нээх", "шинэ данс", "шинээр бүртгүүлэх",
    "хаяг үүсгэх", "регистр", "create account", "бүртгэл хийх", "member болох"
  ],
  
  // Нэвтрэх
  login: [
    "нэвтрэх", "login", "нууц үг", "password", "sign in", "signin",
    "орох", "системд орох", "нэвтэрч орох", "нууц үг мартсан", "forgot password",
    "reset password", "нууц үг сэргээх", "нууц үг солих", "пасворд"
  ],
  
  // Гарах
  logout: [
    "гарах", "logout", "sign out", "signout", "системээс гарах", "log out"
  ],
  
  // Аюулгүй байдал
  security: [
    "2fa", "аюулгүй", "security", "authenticator", "хоёр шатлалт",
    "баталгаажуулалт", "verification", "two factor", "хамгаалалт",
    "нууцлал", "privacy"
  ],
  
  // Сонирхол
  interests: [
    "сонирхол", "interest", "interests", "миний сонирхол", "сонирхлын чиглэл",
    "таалагдах", "дуртай төрөл", "preference", "preferences"
  ],
  
  // Эвент засах
  edit_event: [
    "эвент засах", "эвент өөрчлөх", "edit event", "засварлах", "update event",
    "event засах", "өөрчлөлт оруулах", "мэдээлэл засах", "event update",
    "арга хэмжээ засах", "эвент шинэчлэх"
  ],
  
  // Эвент устгах
  delete_event: [
    "эвент устгах", "delete event", "устгах", "арилгах", "remove event",
    "event устгах", "хасах", "эвент арилгах"
  ],
  
  // Эвент нийтлэх
  publish_event: [
    "нийтлэх", "publish", "draft", "драфт", "ноорог", "эвент нийтлэх",
    "олонд харуулах", "идэвхжүүлэх", "activate"
  ],
  
  // Organizer
  organizer: [
    "organizer", "зохион байгуулагч", "organiser", "event organizer",
    "зохион байгуулагч болох", "организатор", "арга хэмжээ зохион байгуулах"
  ],
  
  // Тасалбар / Бүртгүүлэх
  ticket: [
    "тасалбар", "ticket", "эвентэд бүртгүүлэх", "оролцох", "join event",
    "attend", "оролцогч болох", "бүртгүүлэх эвент", "register event",
    "event-д бүртгүүлэх", "биет оролцох", "оролцохыг хүсч байна"
  ],
  
  // Эвент хайх
  search_event: [
    "хайх", "search", "шүүлтүүр", "filter", "эвент олох", "event олох",
    "хайлт", "find event", "event хайх", "арга хэмжээ хайх", "шүүж харах"
  ],
  
  // Мессеж
  messages: [
    "мессеж", "message", "чат", "холбогдох", "зурвас", "бичих",
    "харилцах", "мессенжер", "chat", "dm", "direct message",
    "зохион байгуулагчтай холбогдох", "хариу бичих"
  ],
  
  // Холбоо барих
  contact: [
    "холбоо барих", "contact", "support", "тусламж", "туслах",
    "асуулт", "санал хүсэлт", "feedback", "help desk", "customer service",
    "хэлтэс", "утас", "имэйл хаяг"
  ],
  
  // Ерөнхий
  general: [
    "eventmn", "юу вэ", "яаж ашиглах", "ямар боломж", "танилцуулга",
    "about", "тухай", "платформ", "сайт", "ямар сайт", "энэ юу вэ",
    "хэрхэн ажилладаг", "боломжууд", "features"
  ]
}

/**
 * Normalize text for better matching
 * - Lowercase
 * - Handle common Mongolian/English variations
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ө/g, "o")
    .replace(/ү/g, "u")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if message matches any pattern in the array
 */
function matchesAnyPattern(message: string, patterns: string[]): boolean {
  const normalizedMessage = normalizeText(message)
  return patterns.some(pattern => {
    const normalizedPattern = normalizeText(pattern)
    return normalizedMessage.includes(normalizedPattern)
  })
}

/**
 * Special check for compound conditions
 */
function hasCompoundMatch(message: string, words1: string[], words2: string[]): boolean {
  const lowerMessage = message.toLowerCase()
  const hasWord1 = words1.some(w => lowerMessage.includes(w))
  const hasWord2 = words2.some(w => lowerMessage.includes(w))
  return hasWord1 && hasWord2
}

/**
 * Get help response for EventMN usage questions
 * Uses semantic matching with synonyms
 */
function getHelpResponse(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  // Эвент үүсгэх - check compound match first
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.create_event) ||
    hasCompoundMatch(message, ["эвент", "event", "арга хэмжээ", "ивент"], ["үүсгэ", "нэмэх", "хийх", "шинэ", "create", "add"])
  ) {
    return FAQ_DATA.create_event
  }
  
  // Эвент засах
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.edit_event) ||
    hasCompoundMatch(message, ["эвент", "event", "арга хэмжээ"], ["засах", "засварлах", "өөрчлөх", "edit", "update"])
  ) {
    return FAQ_DATA.edit_event
  }
  
  // Эвент устгах
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.delete_event) ||
    hasCompoundMatch(message, ["эвент", "event", "арга хэмжээ"], ["устгах", "арилгах", "хасах", "delete", "remove"])
  ) {
    return FAQ_DATA.delete_event
  }
  
  // Эвент нийтлэх
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.publish_event)) {
    return FAQ_DATA.publish_event
  }
  
  // Тасалбар / Эвентэд бүртгүүлэх
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.ticket) ||
    hasCompoundMatch(message, ["эвент", "event", "арга хэмжээ"], ["бүртгүүлэх", "оролцох", "join", "attend"])
  ) {
    return FAQ_DATA.ticket
  }
  
  // Профайл
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.profile)) {
    return FAQ_DATA.profile
  }
  
  // Бүртгэл (not event related)
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.register) &&
    !lowerMessage.includes("эвент") &&
    !lowerMessage.includes("event") &&
    !lowerMessage.includes("арга хэмжээ")
  ) {
    return FAQ_DATA.register
  }
  
  // Нэвтрэх
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.login)) {
    return FAQ_DATA.login
  }
  
  // Гарах
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.logout)) {
    return FAQ_DATA.logout
  }
  
  // Аюулгүй байдал
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.security)) {
    return FAQ_DATA.security
  }
  
  // Сонирхол
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.interests)) {
    return FAQ_DATA.interests
  }
  
  // Organizer
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.organizer)) {
    return FAQ_DATA.organizer
  }
  
  // Эвент хайх
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.search_event)) {
    return FAQ_DATA.search_event
  }
  
  // Мессеж (exclude chatbot mentions)
  if (
    matchesAnyPattern(message, SYNONYM_PATTERNS.messages) &&
    !lowerMessage.includes("чатбот") &&
    !lowerMessage.includes("chatbot") &&
    !lowerMessage.includes("ai")
  ) {
    return FAQ_DATA.messages
  }
  
  // Холбоо барих
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.contact)) {
    return FAQ_DATA.contact
  }
  
  // Ерөнхий
  if (matchesAnyPattern(message, SYNONYM_PATTERNS.general)) {
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
    // Search events from database (limit to 5)
    events = await searchEventsForChat({
      city: intent.city,
      date_range: intent.date_range,
      specific_month: intent.specific_month,
      category: intent.category,
      keywords: intent.keywords,
      price_max: intent.price_max,
      free_only: intent.free_only,
      limit: 5,
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
