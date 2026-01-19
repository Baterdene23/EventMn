// Load environment variables FIRST before any imports that use them
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

// Use DIRECT_URL for seed script (bypasses connection pooler, allows transactions)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL environment variable is not set.")
}

console.log("Connecting to database...")
// New PrismaNeon API: pass { connectionString } object directly
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(" Seeding database...")

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@eventmn.mn" },
    update: {},
    create: {
      id: "usr_001",
      email: "demo@eventmn.mn",
      name: "Demo User",
      role: "ORGANIZER",
      password : "demopassword",
    },
  })
  console.log(" Created demo user:", demoUser.email)

  // Create additional users
  const organizer1 = await prisma.user.upsert({
    where: { email: "organizer1@eventmn.mn" },
    update: {},
    create: {
      id: "usr_100",
      email: "organizer1@eventmn.mn",
      name: "Organizer One",
      role: "ORGANIZER",
      password : "organizerpassword",
    },
  })

  const organizer2 = await prisma.user.upsert({
    where: { email: "organizer2@eventmn.mn" },
    update: {},
    create: {
      id: "usr_101",
      email: "organizer2@eventmn.mn",
      name: "Organizer Two",
      role: "ORGANIZER",
      password : "organizerpassword",
    },
  })

  await prisma.user.upsert({
    where: { email: "admin@eventmn.mn" },
    update: {},
    create: {
      id: "usr_admin",
      email: "admin@eventmn.mn",
      name: "Admin User",
      role: "ADMIN",
      password : "adminpassword",
    },
  })
  console.log(" Created additional users")

  // Create events
  const events = [
    {
      id: "pub_001",
      title: "Дэлхийн сонгодог хөгжим event",
      slug: "delkhiin-songodoh-hogjim-event",
      category: "Хөгжим",
      excerpt: "Тайзны тоглолт, уран бүтээлчид, хөтөлбөр, билет болон оролцогчдын мэдээлэл.",
      date: "2026.05.06",
      city: "Онлайн",
      location: "Online / Live stream",
      startAt: new Date("2026-05-06T11:00:00Z"),
      endAt: new Date("2026-05-06T13:00:00Z"),
      price: 0,
      attendeeCount: 6,
      imageSrc: "/event-covers/cover-1.svg",
      status: "PUBLISHED" as const,
      ownerId: organizer1.id,
    },
    {
      id: "pub_002",
      title: '"NOMADIC LEGEND" ардын урлаг, өв соёлын event',
      slug: "nomadic-legend-ardyn-urlag",
      category: "Уран бүтээл",
      excerpt: 'Цагаан лавай чуулгын "NOMADIC LEGEND" ардын урлаг, өв соёлын хөтөлбөр.',
      date: "2026.05.14",
      city: "Улаанбаатар",
      location: "УДБЭТ (Сүхбаатар дүүрэг)",
      startAt: new Date("2026-05-14T10:00:00Z"),
      endAt: new Date("2026-05-14T12:30:00Z"),
      price: 45000,
      attendeeCount: 2,
      imageSrc: "/event-covers/cover-2.svg",
      status: "PUBLISHED" as const,
      ownerId: organizer2.id,
    },
    {
      id: "pub_003",
      title: "Hun Theatre — Mongolia",
      slug: "hun-theatre-mongolia",
      category: "Театр",
      excerpt: "Үндэсний тайзны урлагийн тоглолт. Огноо, цаг, тасалбарын мэдээлэл.",
      date: "2026.05.20",
      city: "Улаанбаатар",
      location: "Hun Theatre, 1-р хороолол",
      startAt: new Date("2026-05-20T09:00:00Z"),
      endAt: new Date("2026-05-20T11:00:00Z"),
      price: 30000,
      attendeeCount: 18,
      imageSrc: "/event-covers/cover-3.svg",
      status: "PUBLISHED" as const,
      ownerId: organizer1.id,
    },
    {
      id: "evt_001",
      title: "EventMN Launch Meetup",
      slug: "eventmn-launch-meetup",
      category: "Community",
      excerpt: "Launch announcement, speakers, tickets, and check-in flow.",
      imageSrc: "/event-covers/cover-2.svg",
      date: "2026-01-20",
      city: "Ulaanbaatar",
      location: "Sukhbaatar Square",
      startAt: new Date("2026-01-20T09:00:00Z"),
      endAt: new Date("2026-01-20T11:00:00Z"),
      price: 0,
      attendeeCount: 42,
      status: "DRAFT" as const,
      ownerId: demoUser.id,
    },
    {
      id: "evt_002",
      title: "Winter Tech Conference",
      slug: "winter-tech-conference",
      category: "Tech",
      excerpt: "Talks, workshops, sponsors, and attendee management.",
      imageSrc: "/event-covers/cover-1.svg",
      date: "2026-02-05",
      city: "Darkhan",
      location: "Darkhan — Culture Palace",
      startAt: new Date("2026-02-05T02:00:00Z"),
      endAt: new Date("2026-02-06T10:00:00Z"),
      price: 120000,
      attendeeCount: 148,
      status: "PUBLISHED" as const,
      ownerId: demoUser.id,
    },
    {
      id: "prt_001",
      title: "Design Systems 101",
      slug: "design-systems-101",
      category: "Workshop",
      excerpt: "Hands-on session: components, tokens, and UI consistency.",
      imageSrc: "/event-covers/cover-3.svg",
      date: "2026-02-02",
      city: "Ulaanbaatar",
      location: "IC Park, Khan-Uul",
      startAt: new Date("2026-02-02T06:00:00Z"),
      endAt: new Date("2026-02-02T09:00:00Z"),
      price: 25000,
      attendeeCount: 80,
      status: "PUBLISHED" as const,
      ownerId: organizer1.id,
    },
    {
      id: "rec_001",
      title: "Product Meetup: Roadmaps & Metrics",
      slug: "product-meetup-roadmaps-metrics",
      category: "Product",
      excerpt: "Meet peers and learn how teams plan, execute, and measure.",
      imageSrc: "/event-covers/cover-2.svg",
      date: "2026-02-12",
      city: "Ulaanbaatar",
      location: "Central Tower, 12F",
      startAt: new Date("2026-02-12T10:00:00Z"),
      endAt: new Date("2026-02-12T12:00:00Z"),
      price: 15000,
      attendeeCount: 120,
      status: "PUBLISHED" as const,
      ownerId: organizer2.id,
    },
  ]

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: event,
    })
  }
  console.log(" Created", events.length, "events")

  // Create some likes
  await prisma.like.upsert({
    where: { userId_eventId: { userId: demoUser.id, eventId: "pub_001" } },
    update: {},
    create: { userId: demoUser.id, eventId: "pub_001" },
  })
  await prisma.like.upsert({
    where: { userId_eventId: { userId: demoUser.id, eventId: "pub_002" } },
    update: {},
    create: { userId: demoUser.id, eventId: "pub_002" },
  })
  console.log(" Created sample likes")

  // Create some attendees
  await prisma.attendee.upsert({
    where: { userId_eventId: { userId: demoUser.id, eventId: "prt_001" } },
    update: {},
    create: { userId: demoUser.id, eventId: "prt_001", status: "REGISTERED" },
  })
  console.log(" Created sample attendees")

  console.log("🎉 Seeding complete!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
