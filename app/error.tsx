"use client"

import * as React from "react"

import { Button } from "@/components/ui/Button"

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	React.useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-4 py-12">
			<h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
			<p className="text-sm text-muted-foreground">
				Please try again. If it keeps happening, share the error digest.
			</p>
			{error?.digest ? (
				<div className="rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground">
					Digest: {error.digest}
				</div>
			) : null}

			<div className="flex items-center gap-2">
				<Button onClick={() => reset()}>Try again</Button>
				<Button
					variant="secondary"
					onClick={() => {
						window.location.href = "/"
					}}
				>
					Go home
				</Button>
			</div>
		</div>
	)
}

