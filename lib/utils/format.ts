export function formatMNT(amount: number, locale: string = "mn-MN") {
	return new Intl.NumberFormat(locale, { style: "currency", currency: "MNT", maximumFractionDigits: 0 }).format(amount)
}

