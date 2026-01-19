"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/lib/data/categories"

type InterestsSelectorProps = {
	initialInterests: string[]
	onChange?: (interests: string[]) => void
}

export function InterestsSelector({ initialInterests, onChange }: InterestsSelectorProps) {
	const [selected, setSelected] = React.useState<Set<string>>(new Set(initialInterests))

	React.useEffect(() => {
		setSelected(new Set(initialInterests))
	}, [initialInterests])

	function toggleInterest(slug: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(slug)) {
				next.delete(slug)
			} else {
				next.add(slug)
			}
			// Notify parent of changes
			onChange?.(Array.from(next))
			return next
		})
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
				{CATEGORIES.map((category) => {
					const isSelected = selected.has(category.slug)
					return (
						<button
							key={category.slug}
							type="button"
							onClick={() => toggleInterest(category.slug)}
							className={cn(
								"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
								"border-2 hover:scale-105",
								isSelected
									? "border-primary bg-primary text-primary-foreground"
									: "border-muted bg-muted/50 text-foreground hover:border-primary/50 hover:bg-muted"
							)}
						>
							{isSelected && <Check className="h-3.5 w-3.5" />}
							{category.labelMn}
						</button>
					)
				})}
			</div>

			<p className="text-xs text-muted-foreground">
				{selected.size === 0
					? "Сонирхлоо сонгоно уу. Бид танд тохирсон эвентүүдийг санал болгоно."
					: `${selected.size} сонирхол сонгогдсон`}
			</p>
		</div>
	)
}
