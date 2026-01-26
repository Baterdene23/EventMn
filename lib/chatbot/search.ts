/**
 * Event Search Service for Chatbot
 * Searches events based on extracted filters
 */

import { prisma } from "@/lib/db/client"
import { CATEGORIES } from "@/lib/data/categories"

export type ChatEventFilters = {
  city?: string | null
  date_range?: string | null
  specific_month?: number | null
  category?: string | null
  keywords?: string[]
  price_max?: number | null
  free_only?: boolean
  limit?: number
}

export type ChatEventResult = {
  id: string
  title: string
  date: string
  startTime: string | null
  endTime: string | null
  city: string
  location: string | null
  price: number
  category: string
  categoryMn: string
  excerpt: string | null
  slug: string
}

/**
 * Format date and time for Mongolian display
 */
function formatDateTimeMn(date: Date | null): string | null {
  if (!date) return null
  
  const months = [
    "1-р сар", "2-р сар", "3-р сар", "4-р сар",
    "5-р сар", "6-р сар", "7-р сар", "8-р сар",
    "9-р сар", "10-р сар", "11-р сар", "12-р сар"
  ]
  
  const year = date.getFullYear()
  const month = months[date.getMonth()]
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  
  return `${year} оны ${month} ${day}, ${hours}:${minutes}`
}

/**
 * Format only time for display
 */
function formatTimeMn(date: Date | null): string | null {
  if (!date) return null
  
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  
  return `${hours}:${minutes}`
}

/**
 * Calculate date range based on string identifier
 */
function getDateRange(range: string | null): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (range) {
    case "today": {
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      return { from: today, to: endOfDay }
    }
    case "tomorrow": {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const endOfTomorrow = new Date(tomorrow)
      endOfTomorrow.setHours(23, 59, 59, 999)
      return { from: tomorrow, to: endOfTomorrow }
    }
    case "weekend": {
      // Find next Saturday
      const dayOfWeek = today.getDay()
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
      const saturday = new Date(today)
      saturday.setDate(today.getDate() + daysUntilSaturday)
      const sunday = new Date(saturday)
      sunday.setDate(saturday.getDate() + 1)
      sunday.setHours(23, 59, 59, 999)
      return { from: saturday, to: sunday }
    }
    case "this_week": {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
      endOfWeek.setHours(23, 59, 59, 999)
      return { from: today, to: endOfWeek }
    }
    case "this_month": {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      endOfMonth.setHours(23, 59, 59, 999)
      return { from: today, to: endOfMonth }
    }
    case "next_14_days":
    default: {
      const twoWeeks = new Date(today)
      twoWeeks.setDate(today.getDate() + 14)
      twoWeeks.setHours(23, 59, 59, 999)
      return { from: today, to: twoWeeks }
    }
  }
}

/**
 * Calculate date range for a specific month (1-12)
 * If the month is in the past this year, use next year
 */
function getMonthRange(month: number): { from: Date; to: Date } {
  const now = new Date()
  let year = now.getFullYear()
  
  // If the specified month is before current month, use next year
  if (month < now.getMonth() + 1) {
    year += 1
  }
  
  // month is 1-12, JavaScript Date uses 0-11
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const to = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month
  
  return { from, to }
}

/**
 * Get category slug variations for matching
 */
function getCategoryMatches(categorySlug: string): string[] {
  const cat = CATEGORIES.find((c) => c.slug === categorySlug)
  if (cat) {
    return [cat.slug, cat.label, cat.labelMn]
  }
  return [categorySlug]
}

/**
 * Search events based on chatbot filters
 */
export async function searchEventsForChat(
  filters: ChatEventFilters
): Promise<ChatEventResult[]> {
  const limit = filters.limit ?? 10
  
  // Determine date range: specific_month takes priority over date_range
  let from: Date | null = null
  let to: Date | null = null
  
  if (filters.specific_month != null && filters.specific_month >= 1 && filters.specific_month <= 12) {
    const monthRange = getMonthRange(filters.specific_month)
    from = monthRange.from
    to = monthRange.to
  } else if (filters.date_range) {
    const dateRange = getDateRange(filters.date_range)
    from = dateRange.from
    to = dateRange.to
  }

  // Build where conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: "PUBLISHED",
  }
  
  // Date filter - only apply if we have a date range
  if (from && to) {
    where.startAt = { gte: from, lte: to }
  }

  // City filter - only apply if specified (not default)
  if (filters.city && filters.city !== "all") {
    where.city = { equals: filters.city, mode: "insensitive" }
  }

  // Category filter
  if (filters.category) {
    const categoryMatches = getCategoryMatches(filters.category)
    where.category = { in: categoryMatches }
  }

  // Price filter
  if (filters.free_only) {
    where.price = 0
  } else if (filters.price_max != null) {
    where.price = { lte: filters.price_max }
  }

  // Keyword search
  if (filters.keywords && filters.keywords.length > 0) {
    const keywordConditions = filters.keywords.map((keyword) => ({
      OR: [
        { title: { contains: keyword, mode: "insensitive" as const } },
        { excerpt: { contains: keyword, mode: "insensitive" as const } },
        { description: { contains: keyword, mode: "insensitive" as const } },
        { location: { contains: keyword, mode: "insensitive" as const } },
      ],
    }))
    where.AND = keywordConditions
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: [
      { startAt: "asc" },
      { attendeeCount: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      date: true,
      startAt: true,
      endAt: true,
      city: true,
      location: true,
      price: true,
      category: true,
      excerpt: true,
      slug: true,
    },
  })

  return events.map((event) => {
    const cat = CATEGORIES.find(
      (c) =>
        c.slug === event.category ||
        c.label === event.category ||
        c.labelMn === event.category
    )
    
    return {
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: formatDateTimeMn(event.startAt),
      endTime: formatTimeMn(event.endAt),
      city: event.city,
      location: event.location,
      price: event.price,
      category: event.category,
      categoryMn: cat?.labelMn ?? event.category,
      excerpt: event.excerpt,
      slug: event.slug,
    }
  })
}
