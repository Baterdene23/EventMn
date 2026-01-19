import Link from "next/link"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { LikeButton } from "@/components/events/LikeButton"

export type EventStatus = "Draft" | "Published" | "Ended"

export type EventSummary = {
	id: string
	title: string
	date: string
	city: string
	location?: string
	startAt?: string
	endAt?: string
	price?: number
	capacity?: number
	status: EventStatus
	category?: string
	excerpt?: string
	imageSrc?: string
	attendeeCount?: number
}

function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
			<path d="M8 2v4M16 2v4" />
			<path d="M3 10h18" />
			<path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
		</svg>
	)
}

function IconMapPin(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
			<path d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z" />
			<path d="M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
		</svg>
	)
}

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
			<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<path d="M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	)
}

function StatusPill({ status }: { status: EventStatus }) {
	const classes =
		status === "Published"
			? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
			: status === "Ended"
				? "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300"
				: "bg-amber-500/15 text-amber-700 dark:text-amber-300"

	return (
		<span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", classes)}>
			{status}
		</span>
	)
}


export function EventCard({
	event,
	href,
	variant = "public",
	size = "default",
	isAuthed = false,
	initialLiked,
}: {
	event: EventSummary
	href: string
	variant?: "public" | "dashboard"
	size?: "default" | "compact"
	isAuthed?: boolean
	initialLiked?: boolean
}) {
	const compact = size === "compact"
	return (
		<Link
			href={href}
			className={cn(
				"group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
				"hover:bg-accent/20",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			)}
		>
			<div className={cn("relative w-full bg-muted", compact ? "h-40 sm:h-44" : "aspect-video")}>
				<div className="absolute left-3 top-3 z-10">
					<LikeButton eventId={event.id} isAuthed={isAuthed} initialLiked={initialLiked} />
				</div>
				{event.imageSrc ? (
					<Image
						src={event.imageSrc}
						alt={event.title}
						fill
						unoptimized={event.imageSrc.startsWith("blob:") || event.imageSrc.startsWith("data:")}
						sizes="(max-width: 768px) 100vw, 50vw"
						className="object-cover"
						priority={variant === "public"}
					/>
				) : (
					<div className="absolute inset-0 bg-linear-to-br from-primary/15 via-background to-secondary/15" />
				)}
				<div className={cn("absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent", compact ? "h-16" : "h-20")} />
				{variant === "dashboard" ? (
					<div className="absolute right-3 top-3">
						<StatusPill status={event.status} />
					</div>
				) : null}
			</div>

			<div className={cn(compact ? "p-4" : "p-5")}>
				{event.category ? (
					<div className={cn("font-medium uppercase tracking-wide text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
						{event.category}
					</div>
				) : null}
				<h3 className={cn("mt-1 line-clamp-2 font-semibold leading-snug", compact ? "text-base" : "text-lg")}>
					{event.title}
				</h3>
				{event.excerpt ? (
					<p className={cn("mt-2 text-muted-foreground", compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-sm")}>
						{event.excerpt}
					</p>
				) : null}

				<div className={cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
					<span className="inline-flex items-center gap-2">
						<IconCalendar className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
						{event.date}
					</span>
					<span className="inline-flex items-center gap-2">
						<IconMapPin className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
						{event.city}
					</span>
					{typeof event.attendeeCount === "number" ? (
						<span className="inline-flex items-center gap-2">
							<IconUsers className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
							{event.attendeeCount}
						</span>
					) : null}
				</div>
			</div>
		</Link>
	)
}

