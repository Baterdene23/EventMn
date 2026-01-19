import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { CATEGORIES } from "@/lib/data/categories"

type EventPreview = {
  id: string
  title: string
  startAt: Date | null
  city: string | null
  category: string | null
  imageSrc: string | null
  attendeeCount: number
}

// GET /api/events/preview-by-interests?interests=music,tech,sports
// Returns preview events based on selected interests (no auth required)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const interestsParam = searchParams.get("interests")

  if (!interestsParam) {
    return NextResponse.json({ events: [] })
  }

  const interestSlugs = interestsParam.split(",").filter(Boolean)

  if (interestSlugs.length === 0) {
    return NextResponse.json({ events: [] })
  }

  // Map category slugs to category names (both English and Mongolian)
  const categoryNames = interestSlugs
    .map((slug) => {
      const cat = CATEGORIES.find((c) => c.slug === slug)
      return cat ? [cat.label, cat.labelMn] : []
    })
    .flat()
    .filter(Boolean)

  if (categoryNames.length === 0) {
    return NextResponse.json({ events: [] })
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        OR: categoryNames.map((name) => ({
          category: { equals: name, mode: "insensitive" as const },
        })),
      },
      orderBy: { attendeeCount: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        startAt: true,
        city: true,
        category: true,
        imageSrc: true,
        attendeeCount: true,
      },
    })

    // Format events for response
    const formattedEvents = events.map((event: EventPreview) => ({
      id: event.id,
      title: event.title,
      date: event.startAt
        ? new Intl.DateTimeFormat("mn-MN", {
            month: "short",
            day: "numeric",
          }).format(new Date(event.startAt))
        : "",
      city: event.city ?? "Улаанбаатар",
      category: event.category,
      imageSrc: event.imageSrc,
      attendeeCount: event.attendeeCount,
      status: "Published" as const,
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error("Error fetching preview events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
