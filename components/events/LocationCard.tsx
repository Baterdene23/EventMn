import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Location } from "@/lib/data/categories"

interface LocationCardProps {
	location: Location
	className?: string
}

export function LocationCard({ location, className }: LocationCardProps) {
	return (
		<Link
			href={`/d/${location.slug}`}
			className={cn(
				"group relative flex h-40 items-end overflow-hidden rounded-xl p-4 transition-transform hover:scale-[1.02]",
				className
			)}
		>
			{/* Background Image */}
			<Image
				src={location.imageSrc}
				alt={location.nameMn}
				fill
				sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
				className="object-cover transition-transform duration-300 group-hover:scale-105"
			/>
			{/* Overlay gradient */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
			{/* Content */}
			<div className="relative z-10">
				<div className="text-lg font-semibold text-white drop-shadow-md">{location.nameMn}</div>
				<div className="text-sm text-white/80">{location.name}, {location.country}</div>
			</div>
		</Link>
	)
}

interface LocationGridProps {
	locations: Location[]
	className?: string
}

export function LocationGrid({ locations, className }: LocationGridProps) {
	return (
		<div className={cn("grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4", className)}>
			{locations.map((loc) => (
				<LocationCard key={loc.slug} location={loc} />
			))}
		</div>
	)
}
