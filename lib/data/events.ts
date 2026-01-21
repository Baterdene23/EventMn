import type { EventSummary, EventStatus } from "@/components/events/EventCard"
import { prisma } from "@/lib/db/client"
import type { Event, EventStatus as DbEventStatus } from "@prisma/client"
import { CATEGORIES } from "@/lib/data/categories"

export type UserId = string

// Map database status to UI status
function mapEventStatus(status: DbEventStatus): EventStatus {
  switch (status) {
    case "PUBLISHED":
      return "Published"
    case "COMPLETED":
    case "CANCELLED":
      return "Ended"
    case "DRAFT":
    default:
      return "Draft"
  }
}

// Map category slug to Mongolian label
function mapCategoryLabel(slug: string): string {
  const cat = CATEGORIES.find((c) => c.slug === slug)
  return cat?.labelMn ?? slug
}

// Map database event to UI EventSummary
function toEventSummary(event: Event): EventSummary {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    city: event.city,
    location: event.location ?? undefined,
    startAt: event.startAt?.toISOString(),
    endAt: event.endAt?.toISOString(),
    price: event.price,
    capacity: event.capacity ?? undefined,
    status: mapEventStatus(event.status),
    category: mapCategoryLabel(event.category),
    excerpt: event.excerpt ?? undefined,
    description: event.description ?? undefined,
    imageSrc: event.imageSrc ?? undefined,
    attendeeCount: event.attendeeCount,
  }
}

export async function getPublicEvents(): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
    },
  })
  return events.map(toEventSummary)
}

export async function getPublicFeaturedEvents(limit = 4): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: { attendeeCount: "desc" },
    take: limit,
  })
  return events.map(toEventSummary)
}

export async function getEventById(eventId: string): Promise<EventSummary | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  })
  return event ? toEventSummary(event) : null
}

export async function getEventBySlug(slug: string): Promise<EventSummary | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
  })
  return event ? toEventSummary(event) : null
}

export async function getPublicEventById(eventId: string): Promise<EventSummary | null> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
    },
  })
  return event ? toEventSummary(event) : null
}

export async function getDashboardCreatedEvents(userId: UserId): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: { ownerId: userId },
  })
  return events.map(toEventSummary)
}

export async function getDashboardParticipatingEvents(userId: UserId): Promise<EventSummary[]> {
  const attendeeRecords = await prisma.attendee.findMany({
    where: { userId },
    include: { event: true },
  })
  // Filter out events the user owns
  return attendeeRecords
    .filter((a) => a.event.ownerId !== userId)
    .map((a) => toEventSummary(a.event))
}

export async function getDashboardRecommendedEvents(userId: UserId): Promise<EventSummary[]> {
  // Get IDs of events user owns or is attending
  const [ownedEvents, attendingEvents] = await Promise.all([
    prisma.event.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
    prisma.attendee.findMany({
      where: { userId },
      select: { eventId: true },
    }),
  ])

  const excludeIds = new Set([
    ...ownedEvents.map((e) => e.id),
    ...attendingEvents.map((a) => a.eventId),
  ])

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: Array.from(excludeIds) },
    },
    orderBy: { attendeeCount: "desc" },
    take: 6,
  })

  return events.map(toEventSummary)
}

export async function getDashboardEventsForTable(
  userId: UserId
): Promise<Pick<EventSummary, "id" | "title" | "date" | "city" | "status">[]> {
  const events = await prisma.event.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      date: true,
      city: true,
      status: true,
    },
  })

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    city: e.city,
    status: mapEventStatus(e.status),
  }))
}

export type EventAccessRecord = {
  event: EventSummary
  ownerId: UserId
  status: EventStatus
}

export async function getEventAccessRecordById(eventId: string): Promise<EventAccessRecord | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  })
  if (!event) return null

  return {
    event: toEventSummary(event),
    ownerId: event.ownerId,
    status: mapEventStatus(event.status),
  }
}

export async function getDashboardOwnedEventById(
  userId: UserId,
  eventId: string
): Promise<EventSummary | null> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      ownerId: userId,
    },
  })
  return event ? toEventSummary(event) : null
}

export async function setEventStatus(eventId: string, status: EventStatus): Promise<boolean> {
  const dbStatus: DbEventStatus =
    status === "Published" ? "PUBLISHED" : status === "Ended" ? "COMPLETED" : "DRAFT"

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: { status: dbStatus },
    })
    return true
  } catch {
    return false
  }
}

export type CreateEventInput = {
  title: string
  date: string
  city: string
  location?: string
  startAt?: string
  endAt?: string
  price?: number
  capacity?: number
  category: string
  excerpt?: string
  imageSrc?: string
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50) +
    "-" +
    Date.now().toString(36)
  )
}

function pickNextCover(): string {
  const covers = [
    "/event-covers/cover-1.svg",
    "/event-covers/cover-2.svg",
    "/event-covers/cover-3.svg",
  ]
  return covers[Math.floor(Math.random() * covers.length)]
}

export async function createEvent(userId: UserId, input: CreateEventInput): Promise<EventSummary> {
  const event = await prisma.event.create({
    data: {
      title: input.title,
      slug: generateSlug(input.title),
      date: input.date,
      city: input.city,
      location: input.location ?? input.city,
      startAt: input.startAt ? new Date(input.startAt) : null,
      endAt: input.endAt ? new Date(input.endAt) : null,
      price: input.price ?? 0,
      capacity: input.capacity ?? null,
      category: input.category,
      excerpt: input.excerpt ?? "",
      imageSrc: input.imageSrc ?? pickNextCover(),
      status: "DRAFT",
      ownerId: userId,
    },
  })

  return toEventSummary(event)
}

// Search events by query (title, excerpt, category)
export async function searchEvents(query: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { attendeeCount: "desc" },
    take: 20,
  })
  return events.map(toEventSummary)
}

// Get events by city
export async function getEventsByCity(city: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      city: { equals: city, mode: "insensitive" },
    },
  })
  return events.map(toEventSummary)
}

// Get events by category
export async function getEventsByCategory(category: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      category: { equals: category, mode: "insensitive" },
    },
  })
  return events.map(toEventSummary)
}

// Get events by city and category
export async function getEventsByCityAndCategory(
  city: string,
  category: string
): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      city: { equals: city, mode: "insensitive" },
      category: { equals: category, mode: "insensitive" },
    },
  })
  return events.map(toEventSummary)
}

// Get recommended events based on user's interests (categories they've attended/liked)
export async function getRecommendedEventsByInterests(userId: UserId): Promise<EventSummary[]> {
  // Get categories from events the user has attended or liked
  const [attendedEvents, likedEvents, ownedEvents] = await Promise.all([
    prisma.attendee.findMany({
      where: { userId },
      include: { event: { select: { id: true, category: true } } },
    }),
    prisma.like.findMany({
      where: { userId },
      include: { event: { select: { id: true, category: true } } },
    }),
    prisma.event.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
  ])

  // Collect interested categories with frequency
  const categoryCount: Record<string, number> = {}
  for (const a of attendedEvents) {
    categoryCount[a.event.category] = (categoryCount[a.event.category] || 0) + 2 // Weight attending higher
  }
  for (const l of likedEvents) {
    categoryCount[l.event.category] = (categoryCount[l.event.category] || 0) + 1
  }

  // Sort categories by interest level
  const interestedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)

  // Exclude events user already owns, attends, or liked
  const excludeIds = new Set([
    ...ownedEvents.map((e) => e.id),
    ...attendedEvents.map((a) => a.eventId),
    ...likedEvents.map((l) => l.eventId),
  ])

  // If user has interests, prioritize those categories
  if (interestedCategories.length > 0) {
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: Array.from(excludeIds) },
        category: { in: interestedCategories },
      },
      orderBy: { attendeeCount: "desc" },
      take: 6,
    })

    // If we have enough, return them
    if (events.length >= 3) {
      return events.map(toEventSummary)
    }

    // Otherwise, supplement with popular events from any category
    const moreEvents = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: [...Array.from(excludeIds), ...events.map((e) => e.id)] },
      },
      orderBy: { attendeeCount: "desc" },
      take: 6 - events.length,
    })

    return [...events, ...moreEvents].map(toEventSummary)
  }

  // Fallback: just return popular events
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: Array.from(excludeIds) },
    },
    orderBy: { attendeeCount: "desc" },
    take: 6,
  })

  return events.map(toEventSummary)
}

// Get recommended events based on user's saved interests (checklist)
export async function getRecommendedEventsByUserInterests(userId: UserId): Promise<EventSummary[]> {
  // Get user's saved interests and events to exclude
  const [user, ownedEvents, attendedEvents, likedEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true },
    }),
    prisma.event.findMany({
      where: { ownerId: userId },
      select: { id: true },
    }),
    prisma.attendee.findMany({
      where: { userId },
      select: { eventId: true },
    }),
    prisma.like.findMany({
      where: { userId },
      select: { eventId: true },
    }),
  ])

  const userInterests = user?.interests ?? []

  // Strict mode: if user has not selected interests, recommend nothing
  if (userInterests.length === 0) {
    return []
  }

  // Exclude events user already owns, attends, or liked
  const excludeIds = new Set([
    ...ownedEvents.map((e) => e.id),
    ...attendedEvents.map((a) => a.eventId),
    ...likedEvents.map((l) => l.eventId),
  ])

  // User interests are category slugs (e.g., "tech", "music")
  // Event category could be slug OR label/labelMn (legacy data)
  const categoryMatches = userInterests.flatMap((slug) => {
    const cat = CATEGORIES.find((c) => c.slug === slug)
    return cat ? [slug, cat.label, cat.labelMn] : [slug]
  })

  const uniqueCategoryMatches = Array.from(new Set(categoryMatches.filter(Boolean)))
  const categoryOr = uniqueCategoryMatches.map((name) => ({
    category: { equals: name, mode: "insensitive" as const },
  }))

  if (categoryOr.length === 0) {
    return []
  }

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      id: { notIn: Array.from(excludeIds) },
      OR: categoryOr,
    },
    orderBy: { attendeeCount: "desc" },
    take: 6,
  })

  return events.map(toEventSummary)
}
