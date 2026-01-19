"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string; disabled?: boolean }

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
	label?: string
	options: SelectOption[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, label, options, ...props }, ref) => {
		return (
			<div className="space-y-1">
				{label ? <div className="text-xs font-medium text-muted-foreground">{label}</div> : null}
				<select
					ref={ref}
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value} disabled={opt.disabled}>
							{opt.label}
						</option>
					))}
				</select>
			</div>
		)
	},
)

Select.displayName = "Select"

