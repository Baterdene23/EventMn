import Link from "next/link"

import { Button } from "@/components/ui/Button"

export default function NotFound() {
	return (
		<div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-4 py-12">
			<h1 className="text-3xl font-semibold tracking-tight">404 — Page not found</h1>
			<p className="text-sm text-muted-foreground">
				Таны хайсан хуудас олдсонгүй. Home руу буцаад public events-ээ үзэж болно.
			</p>
			<div className="flex items-center gap-2">
				<Button asChild>
					<Link href="/">Go home</Link>
				</Button>
				<Button variant="secondary" asChild>
					<Link href="/events">Browse events</Link>
				</Button>
			</div>
		</div>
	)
}

