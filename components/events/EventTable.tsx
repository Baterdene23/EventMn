import Link from "next/link"

import type { EventSummary } from "@/components/events/EventCard"
import { cn } from "@/lib/utils"

function StatusDot({ status }: { status: EventSummary["status"] }) {
	const dotClass =
		status === "Published" ? "bg-emerald-500" : status === "Ended" ? "bg-zinc-500" : "bg-amber-500"
	return <span className={cn("inline-block h-2 w-2 rounded-full", dotClass)} aria-hidden="true" />
}

export function EventTable({ events }: { events: EventSummary[] }) {
	return (
		<div className="overflow-hidden rounded-2xl border bg-card">
			<div className="grid grid-cols-12 gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
				<div className="col-span-6">Event</div>
				<div className="col-span-2">City</div>
				<div className="col-span-2">Date</div>
				<div className="col-span-2">Status</div>
			</div>

			<div className="divide-y">
				{events.map((event) => (
					<Link
						key={event.id}
						href={`/events/${event.id}`}
						className="grid grid-cols-12 gap-3 px-4 py-4 text-sm hover:bg-accent/30"
					>
						<div className="col-span-6 font-medium">{event.title}</div>
						<div className="col-span-2 text-muted-foreground">{event.city}</div>
						<div className="col-span-2 text-muted-foreground">{event.date}</div>
						<div className="col-span-2 flex items-center gap-2">
							<StatusDot status={event.status} />
							<span className="text-muted-foreground">{event.status}</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}

