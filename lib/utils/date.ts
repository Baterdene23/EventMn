export function formatDate(date: Date | string, locale: string = "mn-MN") {
	const d = typeof date === "string" ? new Date(date) : date
	if (Number.isNaN(d.getTime())) return ""
	return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

