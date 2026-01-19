import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params
		const cookieStore = await cookies()
		const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Нэвтэрсэн байх шаардлагатай" },
				{ status: 401 }
			)
		}

		// Get session and user
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		})

		if (!session || session.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "Session хүчингүй болсон" },
				{ status: 401 }
			)
		}

		const userId = session.userId

		// Check if event exists
		const event = await prisma.event.findUnique({
			where: { id: eventId },
		})

		if (!event) {
			return NextResponse.json(
				{ error: "Эвент олдсонгүй" },
				{ status: 404 }
			)
		}

		// Check if already attending
		const existingAttendee = await prisma.attendee.findUnique({
			where: {
				userId_eventId: { userId, eventId },
			},
		})

		if (existingAttendee) {
			return NextResponse.json(
				{ error: "Та аль хэдийн бүртгүүлсэн байна" },
				{ status: 400 }
			)
		}

		// Create attendee record
		await prisma.attendee.create({
			data: {
				userId,
				eventId,
				status: "REGISTERED",
			},
		})

		// Increment attendee count
		await prisma.event.update({
			where: { id: eventId },
			data: { attendeeCount: { increment: 1 } },
		})

		// Event эзэнд notification илгээх (өөрийнхөө event биш бол)
		if (event.ownerId !== userId) {
			try {
				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: { name: true },
				})
				await prisma.notification.create({
					data: {
						userId: event.ownerId,
						type: "NEW_ATTENDEE",
						title: "Шинэ оролцогч",
						message: `${user?.name || "Хэрэглэгч"} таны "${event.title}" эвентэд бүртгүүллээ`,
						link: `/events/${eventId}`,
						eventId,
						fromUserId: userId,
					},
				})
			} catch {
				// Notification table үүсээгүй байж магадгүй
			}
		}

		return NextResponse.json({ ok: true, message: "Амжилттай бүртгэгдлээ" })
	} catch (error) {
		console.error("Attend error:", error)
		return NextResponse.json(
			{ error: "Бүртгүүлэхэд алдаа гарлаа" },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params
		const cookieStore = await cookies()
		const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

		if (!sessionId) {
			return NextResponse.json(
				{ error: "Нэвтэрсэн байх шаардлагатай" },
				{ status: 401 }
			)
		}

		// Get session
		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		})

		if (!session || session.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "Session хүчингүй болсон" },
				{ status: 401 }
			)
		}

		const userId = session.userId

		// Check if attending
		const attendee = await prisma.attendee.findUnique({
			where: {
				userId_eventId: { userId, eventId },
			},
		})

		if (!attendee) {
			return NextResponse.json(
				{ error: "Та бүртгүүлээгүй байна" },
				{ status: 400 }
			)
		}

		// Get event and user info for notification
		const [event, user] = await Promise.all([
			prisma.event.findUnique({
				where: { id: eventId },
				select: { title: true, ownerId: true },
			}),
			prisma.user.findUnique({
				where: { id: userId },
				select: { name: true },
			}),
		])

		// Delete attendee record
		await prisma.attendee.delete({
			where: { id: attendee.id },
		})

		// Decrement attendee count
		await prisma.event.update({
			where: { id: eventId },
			data: { attendeeCount: { decrement: 1 } },
		})

		// Event эзэнд цуцалсан notification илгээх
		if (event && event.ownerId !== userId) {
			try {
				await prisma.notification.create({
					data: {
						userId: event.ownerId,
						type: "ATTENDEE_CANCELLED",
						title: "Оролцогч цуцаллаа",
						message: `${user?.name || "Хэрэглэгч"} таны "${event.title}" эвентээс гарлаа`,
						link: `/events/${eventId}`,
						eventId,
						fromUserId: userId,
					},
				})
			} catch {
				// Notification table error - ignore
			}
		}

		return NextResponse.json({ ok: true, message: "Бүртгэл цуцлагдлаа" })
	} catch (error) {
		console.error("Cancel attend error:", error)
		return NextResponse.json(
			{ error: "Цуцлахад алдаа гарлаа" },
			{ status: 500 }
		)
	}
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ eventId: string }> }
) {
	try {
		const { eventId } = await params
		const cookieStore = await cookies()
		const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

		if (!sessionId) {
			return NextResponse.json({ isAttending: false })
		}

		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		})

		if (!session || session.expiresAt < new Date()) {
			return NextResponse.json({ isAttending: false })
		}

		const attendee = await prisma.attendee.findUnique({
			where: {
				userId_eventId: { userId: session.userId, eventId },
			},
		})

		return NextResponse.json({ isAttending: !!attendee })
	} catch {
		return NextResponse.json({ isAttending: false })
	}
}
