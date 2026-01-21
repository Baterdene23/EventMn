import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, MapPin, Users, Tag, Clock, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LikeButton } from "@/components/events/LikeButton"
import { AttendButton } from "@/components/events/AttendButton"
import { EventMessages } from "@/components/events/EventMessages"
import { getEventAccessRecordById } from "@/lib/data/events"
import { getSession } from "@/lib/auth/session"
import { getLikedEventIds } from "@/lib/data/likes"
import { isUserAttending } from "@/lib/data/attendees"

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params
	const session = await getSession()
	const record = await getEventAccessRecordById(eventId)
	if (!record) notFound()

	const canViewPublic = record.status === "Published"
	const canViewAsOwner = !!session && record.ownerId === session.userId
	if (!canViewPublic && !canViewAsOwner) notFound()

	const event = record.event
	const showManage = canViewAsOwner
	const likedIds = session ? new Set(await getLikedEventIds(session.userId)) : new Set<string>()
	const isAttending = session ? await isUserAttending(session.userId, eventId) : false

	return (
		<div className="space-y-8">
			{/* Hero Image */}
			<div className="relative -mx-4 -mt-8 h-64 overflow-hidden bg-muted sm:h-80 md:h-96 lg:-mx-0 lg:rounded-2xl">
				{event.imageSrc ? (
					<Image
						src={event.imageSrc}
						alt={event.title}
						fill
						sizes="(max-width: 768px) 100vw, 1200px"
						className="object-cover"
						priority
					/>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
				)}
			</div>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Main Content */}
				<div className="space-y-6 lg:col-span-2">
					<div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Tag className="h-4 w-4" />
							<span>{event.category ?? "Event"}</span>
						</div>
						<h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
							{event.title}
						</h1>
					</div>

					<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							<span>{event.date}</span>
						</div>
						{event.startAt && (
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<span>{new Date(event.startAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}</span>
							</div>
						)}
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							<span>{event.location ?? event.city}</span>
						</div>
						{typeof event.attendeeCount === "number" && (
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								<span>
									{event.attendeeCount} оролцогч
									{event.capacity && ` / ${event.capacity}`}
								</span>
							</div>
						)}
					</div>

					<Separator />

					<div>
						<h2 className="text-lg font-semibold">Тайлбар</h2>
						<p className="mt-3 leading-relaxed text-muted-foreground">
							{event.excerpt ?? "Энэ эвентийн дэлгэрэнгүй мэдээлэл удахгүй нэмэгдэнэ."}
						</p>
					</div>

					<Separator />

					<div>
						<h2 className="text-lg font-semibold">Байршил</h2>
						<p className="mt-3 text-muted-foreground">
							{event.location ?? event.city}
						</p>
						<Link
							href={`/d/${event.city.toLowerCase().replace(/\s+/g, "-")}`}
							className="mt-2 inline-block text-sm text-primary hover:underline"
						>
							{event.city} дахь бусад эвентүүд
						</Link>
					</div>

					<Separator />

					{/* Event Messages / Chat */}
					<EventMessages 
						eventId={event.id} 
						isAuthed={!!session} 
						currentUserId={session?.userId}
					/>
				</div>

				<div className="lg:col-span-1">
					<Card className="sticky top-20">
						<CardContent className="space-y-4 p-6">
							<div className="text-center">
								<div className="text-3xl font-bold">
									{event.price === 0 ? "Үнэгүй" : `₮${event.price?.toLocaleString()}`}
								</div>
								<p className="mt-1 text-sm text-muted-foreground">
									{event.startAt && `Эхлэх: ${new Date(event.startAt).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}`}
								</p>
							</div>

							<Separator />

							<div className="space-y-3">
								{showManage ? (
									<Button className="w-full" asChild>
										<Link href={`/events/${event.id}/edit`}>Удирдах</Link>
									</Button>
								) : (
									<>
										<AttendButton
											eventId={event.id}
											isAuthed={!!session}
											initialAttending={isAttending}
										/>
										{/* Холбогдох товч - event эзэнтэй private message */}
										{session && session.userId !== record.ownerId && (
											<Button variant="outline" className="w-full" asChild>
												<Link href={`/dashboard/messages/${event.id}_${record.ownerId}`}>
													<MessageCircle className="mr-2 h-4 w-4" />
													Зохион байгуулагчтай холбогдох
												</Link>
											</Button>
										)}
									</>
								)}
								<div className="flex gap-2">
									<Button variant="outline" className="flex-1" asChild>
										<Link href="/events">Бусад эвентүүд</Link>
									</Button>
									{session && (
										<LikeButton
											eventId={event.id}
											isAuthed
											initialLiked={likedIds.has(event.id)}
										/>
									)}
								</div>
							</div>

							{typeof event.attendeeCount === "number" && event.attendeeCount > 0 && (
								<>
									<Separator />
									<div className="text-center text-sm text-muted-foreground">
										<p>{event.attendeeCount} хүн бүртгүүлсэн</p>
										{event.capacity && (
											<p className="mt-1">
												{event.capacity - event.attendeeCount > 0 
													? `${event.capacity - event.attendeeCount} суудал үлдсэн`
													: "Бүх суудал дүүрсэн"
												}
											</p>
										)}
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
