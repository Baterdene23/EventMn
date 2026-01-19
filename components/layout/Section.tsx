import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface SectionProps {
	children: ReactNode
	className?: string
}

export function Section({ children, className }: SectionProps) {
	return (
		<section className={cn("space-y-4", className)}>
			{children}
		</section>
	)
}

interface SectionHeaderProps {
	title: string
	action?: ReactNode
	className?: string
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
	return (
		<div className={cn("flex items-center justify-between", className)}>
			<h2 className="text-lg font-semibold">{title}</h2>
			{action}
		</div>
	)
}
