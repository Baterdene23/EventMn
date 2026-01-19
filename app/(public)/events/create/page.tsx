import { EventForm } from "@/components/events/EventForm"
import { requireUser } from "@/lib/auth/guards"

export default async function PublicCreateEventPage() {
	await requireUser({ returnTo: "/events/create" })

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Шинэ эвент үүсгэх</h1>
				<p className="text-sm text-muted-foreground">Эвентийн талаарх дэлгэрэнгүй мэдээллийг оруулна уу.</p>
			</div>
			<div className="rounded-2xl border bg-card p-5">
				<EventForm />
			</div>
		</div>
	)
}
