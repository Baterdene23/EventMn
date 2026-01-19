export type Category = {
	slug: string
	label: string
	labelMn: string
	icon?: string
}

export type Location = {
	slug: string
	name: string
	nameMn: string
	country: string
	imageSrc: string
}

export const CATEGORIES: Category[] = [
	{ slug: "music", label: "Music", labelMn: "Хөгжим" },
	{ slug: "arts", label: "Performing & Visual Arts", labelMn: "Уран бүтээл" },
	{ slug: "business", label: "Business", labelMn: "Бизнес" },
	{ slug: "food-and-drink", label: "Food & Drink", labelMn: "Хоол & Уух зүйл" },
	{ slug: "sports", label: "Sports & Fitness", labelMn: "Спорт" },
	{ slug: "tech", label: "Science & Tech", labelMn: "Технологи" },
	{ slug: "community", label: "Community", labelMn: "Нийгэмлэг" },
	{ slug: "education", label: "Education", labelMn: "Боловсрол" },
	{ slug: "health", label: "Health & Wellness", labelMn: "Эрүүл мэнд" },
]

export const LOCATIONS: Location[] = [
	{ slug: "ulaanbaatar", name: "Ulaanbaatar", nameMn: "Улаанбаатар", country: "Mongolia", imageSrc: "/locations/ulaanbaatar.svg" },
	{ slug: "darkhan", name: "Darkhan", nameMn: "Дархан", country: "Mongolia", imageSrc: "/locations/darkhan.svg" },
	{ slug: "erdenet", name: "Erdenet", nameMn: "Эрдэнэт", country: "Mongolia", imageSrc: "/locations/erdenet.svg" },
	{ slug: "online", name: "Online", nameMn: "Онлайн", country: "Global", imageSrc: "/locations/online.svg" },
]

export function getCategoryBySlug(slug: string): Category | undefined {
	return CATEGORIES.find((c) => c.slug === slug)
}

export function getLocationBySlug(slug: string): Location | undefined {
	return LOCATIONS.find((l) => l.slug === slug)
}
