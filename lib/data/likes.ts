import { prisma } from "@/lib/db/client"

export type UserId = string

export async function getLikedEventIds(userId: UserId): Promise<string[]> {
  const likes = await prisma.like.findMany({
    where: { userId },
    select: { eventId: true },
  })
  return likes.map((l) => l.eventId)
}

export async function isEventLiked(userId: UserId, eventId: string): Promise<boolean> {
  const like = await prisma.like.findUnique({
    where: {
      userId_eventId: { userId, eventId },
    },
  })
  return like !== null
}

export async function likeEvent(userId: UserId, eventId: string): Promise<void> {
  await prisma.like.upsert({
    where: {
      userId_eventId: { userId, eventId },
    },
    update: {},
    create: { userId, eventId },
  })

  // Event эзэнд notification илгээх
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { ownerId: true, title: true },
    })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })
    if (event && event.ownerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: event.ownerId,
          type: "SYSTEM",
          title: "Эвент таалагдлаа",
          message: `${user?.name || "Хэрэглэгч"} таны "${event.title}" эвентийг таалагдлаа гэж тэмдэглэлээ`,
          link: `/events/${eventId}`,
          eventId,
          fromUserId: userId,
        },
      })
    }
  } catch {
    // Notification table үүсээгүй байж магадгүй
  }
}

export async function unlikeEvent(userId: UserId, eventId: string): Promise<void> {
  await prisma.like.deleteMany({
    where: { userId, eventId },
  })
}

export async function getLikeCount(eventId: string): Promise<number> {
  return prisma.like.count({
    where: { eventId },
  })
}
