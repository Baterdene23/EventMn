"use client"

import * as React from "react"
import { Bell, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"

type BadgeCountProps = {
	count: number
	className?: string
}

/**
 * Simple numeric badge for showing unread counts
 */
export function BadgeCount({ count, className }: BadgeCountProps) {
	if (count <= 0) return null

	const displayCount = count > 99 ? "99+" : count.toString()

	return (
		<span
			className={cn(
				"absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white",
				className
			)}
		>
			{displayCount}
		</span>
	)
}

type NavBadgeIconProps = {
	icon: React.ElementType
	count: number
	label: string
	onClick?: () => void
	className?: string
}

/**
 * Navigation icon with badge count
 */
export function NavBadgeIcon({
	icon: Icon,
	count,
	label,
	onClick,
	className,
}: NavBadgeIconProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"relative rounded-md p-2 hover:bg-accent",
				className
			)}
			aria-label={`${label} (${count} unread)`}
		>
			<Icon className="h-5 w-5" />
			<BadgeCount count={count} />
		</button>
	)
}

type BadgeCounts = {
	notifications: number
	messages: number
}

type NavbarBadgesProps = {
	counts: BadgeCounts
	onNotificationsClick?: () => void
	onMessagesClick?: () => void
}

/**
 * Example navbar badges component
 * 
 * Usage:
 * ```tsx
 * // Server component fetches counts
 * import { getBadgeCounts } from "@/lib/data/badges"
 * 
 * export async function Navbar() {
 *   const session = await getSession()
 *   const counts = session ? await getBadgeCounts(session.userId) : { notifications: 0, messages: 0 }
 *   return <NavbarClient counts={counts} />
 * }
 * 
 * // Client component renders badges
 * "use client"
 * export function NavbarClient({ counts }) {
 *   return <NavbarBadges counts={counts} />
 * }
 * ```
 */
export function NavbarBadges({
	counts,
	onNotificationsClick,
	onMessagesClick,
}: NavbarBadgesProps) {
	return (
		<div className="flex items-center gap-1">
			<NavBadgeIcon
				icon={Bell}
				count={counts.notifications}
				label="Notifications"
				onClick={onNotificationsClick}
			/>
			<NavBadgeIcon
				icon={MessageCircle}
				count={counts.messages}
				label="Messages"
				onClick={onMessagesClick}
			/>
		</div>
	)
}

/**
 * Hook to fetch badge counts via API
 * Use this for real-time updates in client components
 */
export function useBadgeCounts(pollInterval = 30000) {
	const [counts, setCounts] = React.useState<BadgeCounts>({
		notifications: 0,
		messages: 0,
	})
	const [loading, setLoading] = React.useState(true)

	const fetchCounts = React.useCallback(async () => {
		try {
			const [notifRes, msgRes, privateRes] = await Promise.all([
				fetch("/api/notification"),
				fetch("/api/conversations"),
				fetch("/api/messages"),
			])

			let notificationCount = 0
			let messageCount = 0

			if (notifRes.ok) {
				const notifData = await notifRes.json()
				notificationCount = notifData.unreadCount || 0
			}

			// Count how many PEOPLE have sent unread messages, not total messages
			if (msgRes.ok) {
				const msgData = await msgRes.json()
				messageCount += msgData.unreadPeopleCount || 0
			}

			if (privateRes.ok) {
				const privateData = await privateRes.json()
				messageCount += privateData.unreadPeopleCount || 0
			}

			setCounts({
				notifications: notificationCount,
				messages: messageCount,
			})
		} catch {
			// Ignore errors during polling
		} finally {
			setLoading(false)
		}
	}, [])

	React.useEffect(() => {
		fetchCounts()

		if (pollInterval > 0) {
			const interval = setInterval(fetchCounts, pollInterval)
			return () => clearInterval(interval)
		}
	}, [fetchCounts, pollInterval])

	return { counts, loading, refetch: fetchCounts }
}
