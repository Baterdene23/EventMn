"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, Check, CheckCheck, MessageCircle, Calendar, Users, UserMinus, Info } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

type Notification = {
	id: string
	type: "MESSAGE" | "EVENT_REMINDER" | "EVENT_UPDATE" | "NEW_ATTENDEE" | "ATTENDEE_CANCELLED" | "SYSTEM"
	title: string
	message: string
	link: string | null
	isRead: boolean
	createdAt: string
	eventId: string | null
	fromUserId: string | null
}

const typeIcons = {
	MESSAGE: MessageCircle,
	EVENT_REMINDER: Calendar,
	EVENT_UPDATE: Calendar,
	NEW_ATTENDEE: Users,
	ATTENDEE_CANCELLED: UserMinus,
	SYSTEM: Info,
}

const typeColors = {
	MESSAGE: "text-blue-500",
	EVENT_REMINDER: "text-orange-500",
	EVENT_UPDATE: "text-green-500",
	NEW_ATTENDEE: "text-purple-500",
	ATTENDEE_CANCELLED: "text-red-500",
	SYSTEM: "text-gray-500",
}

export default function DashboardNotificationPage() {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [loading, setLoading] = useState(true)
	const [unreadCount, setUnreadCount] = useState(0)

	useEffect(() => {
		async function fetchNotifications() {
			try {
				const res = await fetch("/api/notification")
				if (res.ok) {
					const data = await res.json()
					setNotifications(data.notifications)
					setUnreadCount(data.unreadCount)
				}
			} catch (error) {
				console.error("Failed to fetch notifications:", error)
			} finally {
				setLoading(false)
			}
		}
		fetchNotifications()
	}, [])

	async function markAsRead(notificationId: string) {
		try {
			await fetch("/api/notification/read", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notificationId }),
			})
			setNotifications((prev) =>
				prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
			)
			setUnreadCount((prev) => Math.max(0, prev - 1))
		} catch (error) {
			console.error("Failed to mark as read:", error)
		}
	}

	async function markAllAsRead() {
		try {
			await fetch("/api/notification/read", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAll: true }),
			})
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
			setUnreadCount(0)
		} catch (error) {
			console.error("Failed to mark all as read:", error)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Мэдэгдлүүд</h1>
					<p className="text-sm text-muted-foreground">
						{unreadCount > 0
							? `${unreadCount} уншаагүй мэдэгдэл`
							: "Бүх мэдэгдлийг уншсан"}
					</p>
				</div>
				{unreadCount > 0 && (
					<Button variant="outline" size="sm" onClick={markAllAsRead}>
						<CheckCheck className="mr-2 h-4 w-4" />
						Бүгдийг уншсан болгох
					</Button>
				)}
			</div>

			<div className="rounded-2xl border bg-card">
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
						<p className="text-sm text-muted-foreground">
							Одоогоор мэдэгдэл байхгүй байна
						</p>
					</div>
				) : (
					<div className="divide-y">
						{notifications.map((notification) => {
							const Icon = typeIcons[notification.type]
							const colorClass = typeColors[notification.type]

							const content = (
								<div
									className={cn(
										"flex items-start gap-4 p-4 transition-colors",
										!notification.isRead && "bg-muted/50",
										notification.link && "hover:bg-muted/70"
									)}
								>
									{/* Icon */}
									<div
										className={cn(
											"flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
											colorClass
										)}
									>
										<Icon className="h-5 w-5" />
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p
												className={cn(
													"font-medium",
													!notification.isRead && "text-foreground"
												)}
											>
												{notification.title}
											</p>
											{!notification.isRead && (
												<span className="h-2 w-2 rounded-full bg-primary" />
											)}
										</div>
										<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
											{notification.message}
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											{formatRelativeTime(notification.createdAt)}
										</p>
									</div>

									{/* Mark as read button */}
									{!notification.isRead && (
										<Button
											variant="ghost"
											size="icon"
											className="shrink-0"
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
												markAsRead(notification.id)
											}}
										>
											<Check className="h-4 w-4" />
										</Button>
									)}
								</div>
							)

							if (notification.link) {
								return (
									<Link
										key={notification.id}
										href={notification.link}
										onClick={() => {
											if (!notification.isRead) {
												markAsRead(notification.id)
											}
										}}
									>
										{content}
									</Link>
								)
							}

							return <div key={notification.id}>{content}</div>
						})}
					</div>
				)}
			</div>
		</div>
	)
}

function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	if (diffInSeconds < 60) return "Саяхан"
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} минутын өмнө`
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} цагийн өмнө`
	if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} өдрийн өмнө`

	return date.toLocaleDateString("mn-MN", { month: "short", day: "numeric" })
}
