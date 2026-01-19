import Link from "next/link"
import { Music, Palette, PartyPopper, Heart, Briefcase, UtensilsCrossed, Dumbbell, Cpu, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/lib/data/categories"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
	music: <Music className="h-5 w-5" />,
	arts: <Palette className="h-5 w-5" />,
	business: <Briefcase className="h-5 w-5" />,
	"food-and-drink": <UtensilsCrossed className="h-5 w-5" />,
	sports: <Dumbbell className="h-5 w-5" />,
	tech: <Cpu className="h-5 w-5" />,
	community: <Users className="h-5 w-5" />,
	education: <PartyPopper className="h-5 w-5" />,
	health: <Heart className="h-5 w-5" />,
}

interface CategoryNavProps {
	location?: string
	activeCategory?: string
	className?: string
}

export function CategoryNav({ location, activeCategory, className }: CategoryNavProps) {
	return (
		<nav className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
			{CATEGORIES.map((cat) => {
				const isActive = cat.slug === activeCategory
				// If location is provided, link to /b/[location]/[category]
				// Otherwise, link to /c/[category] for all locations
				const href = location ? `/b/${location}/${cat.slug}` : `/c/${cat.slug}`
				return (
					<Link
						key={cat.slug}
						href={href}
						className={cn(
							"flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "bg-card hover:bg-accent"
						)}
					>
						{CATEGORY_ICONS[cat.slug]}
						<span>{cat.labelMn}</span>
					</Link>
				)
			})}
		</nav>
	)
}
