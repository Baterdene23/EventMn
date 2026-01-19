"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type ModalProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	children: React.ReactNode
	footer?: React.ReactNode
}

export function Modal({ open, onOpenChange, title, children, footer }: ModalProps) {
	React.useEffect(() => {
		if (!open) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onOpenChange(false)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [open, onOpenChange])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50">
			<button
				aria-label="Close"
				className="absolute inset-0 bg-black/40"
				onClick={() => onOpenChange(false)}
			/>

			<div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2">
				<div className={cn("rounded-2xl border bg-card p-5 shadow-lg")}> 
					{title ? <div className="text-lg font-semibold">{title}</div> : null}
					<div className={cn(title ? "mt-3" : "", "text-sm")}>{children}</div>
					{footer ? <div className="mt-5 flex items-center justify-end gap-2">{footer}</div> : null}
				</div>
			</div>
		</div>
	)
}

