"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { CATEGORIES } from "@/lib/data/categories"

type EventEditFormProps = {
	event: {
		id: string
		title: string
		excerpt?: string | null
		description?: string | null
		date: string
		startAt?: string | null
		city: string
		location?: string | null
		category: string
		price: number
		capacity?: number | null
		imageSrc?: string | null
		status: string
	}
}

export function EventEditForm({ event }: EventEditFormProps) {
	const router = useRouter()
	const [coverFile, setCoverFile] = React.useState<File | null>(null)
	const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null)
	// Extract time from startAt if exists
	const initialStartTime = event.startAt 
		? new Date(event.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
		: ""

	const [values, setValues] = React.useState({
		title: event.title,
		excerpt: event.excerpt ?? "",
		description: event.description ?? "",
		date: event.date,
		startTime: initialStartTime,
		city: event.city,
		location: event.location ?? "",
		category: event.category,
		price: event.price,
		capacity: event.capacity ?? "",
	})
	const [saving, setSaving] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		return () => {
			if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
		}
	}, [coverPreviewUrl])

	function update<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
		setValues((prev) => ({ ...prev, [key]: val }))
	}

	async function uploadImage(file: File): Promise<string | null> {
		try {
			const formData = new FormData()
			formData.append("file", file)

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			})

			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { error?: string } | null
				throw new Error(body?.error ?? "Upload failed")
			}

			const body = (await res.json()) as { url: string }
			return body.url
		} catch (err) {
			setError(err instanceof Error ? err.message : "Зураг байршуулахад алдаа гарлаа")
			return null
		}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!values.title.trim()) {
			setError("Гарчиг оруулна уу")
			return
		}
		setSaving(true)
		setError(null)

		try {
			let imageSrc: string | undefined
			if (coverFile) {
				const uploadedUrl = await uploadImage(coverFile)
				if (!uploadedUrl) {
					setSaving(false)
					return
				}
				imageSrc = uploadedUrl
			}

			const res = await fetch(`/api/events/${event.id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					...values,
					startAt: values.date && values.startTime 
						? `${values.date}T${values.startTime}:00` 
						: undefined,
					capacity: values.capacity ? Number(values.capacity) : null,
					...(imageSrc && { imageSrc }),
				}),
			})

			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { error?: string } | null
				setError(body?.error ?? "Хадгалахад алдаа гарлаа")
				return
			}

			router.push(`/events/${event.id}`)
			router.refresh()
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete() {
		const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" })
		if (res.ok) {
			router.push("/dashboard")
			router.refresh()
		} else {
			const body = (await res.json().catch(() => null)) as { error?: string } | null
			setError(body?.error ?? "Устгахад алдаа гарлаа")
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			{error && (
				<div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<div className="text-sm font-medium">Эвентийн нэр</div>
				<Input
					value={values.title}
					onChange={(e) => update("title", e.target.value)}
					placeholder="Эвентийн нэр"
				/>
			</div>

			<div className="space-y-2">
				<div className="text-sm font-medium">Товч тайлбар</div>
				<Input
					value={values.excerpt}
					onChange={(e) => update("excerpt", e.target.value)}
					placeholder="Товч тайлбар"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<div className="text-sm font-medium">Огноо</div>
					<Input
						type="date"
						value={values.date}
						onChange={(e) => update("date", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<div className="text-sm font-medium">Эхлэх цаг</div>
					<Input
						type="time"
						value={values.startTime}
						onChange={(e) => update("startTime", e.target.value)}
					/>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<div className="text-sm font-medium">Хот</div>
					<Input
						value={values.city}
						onChange={(e) => update("city", e.target.value)}
						placeholder="Улаанбаатар"
					/>
				</div>
				<div className="space-y-2">
					<div className="text-sm font-medium">Оролцогчдын тоо</div>
					<Input
						type="number"
						value={values.capacity}
						onChange={(e) => update("capacity", e.target.value ? Number(e.target.value) : "")}
						placeholder="Хязгааргүй бол хоосон"
						min="1"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<div className="text-sm font-medium">Байршил</div>
				<Input
					value={values.location}
					onChange={(e) => update("location", e.target.value)}
					placeholder="Байршлын дэлгэрэнгүй"
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Select
					label="Төрөл"
					value={values.category}
					onChange={(e) => update("category", e.target.value)}
					options={CATEGORIES.map((cat) => ({
						value: cat.slug,
						label: cat.labelMn,
					}))}
				/>
				<div className="space-y-2">
					<div className="text-sm font-medium">Үнэ (₮)</div>
					<Input
						type="number"
						value={values.price}
						onChange={(e) => update("price", Number(e.target.value))}
						placeholder="0"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<div className="text-sm font-medium">Зураг</div>
				{event.imageSrc && !coverPreviewUrl && (
					<div className="overflow-hidden rounded-lg border">
						<div className="relative h-40 w-full">
							<Image
								src={event.imageSrc}
								alt="Current cover"
								fill
								className="object-cover"
							/>
						</div>
						<div className="px-3 py-2 text-xs text-muted-foreground">Одоогийн зураг</div>
					</div>
				)}
				<input
					type="file"
					accept="image/*"
					className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-accent/40"
					onChange={(e) => {
						const file = e.target.files?.[0] ?? null
						setCoverFile(file)
						if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
						setCoverPreviewUrl(file ? URL.createObjectURL(file) : null)
					}}
				/>
				{coverPreviewUrl && (
					<div className="overflow-hidden rounded-lg border">
						<div className="relative h-40 w-full">
							<Image
								unoptimized
								src={coverPreviewUrl}
								alt="New cover preview"
								fill
								className="object-cover"
							/>
						</div>
						<div className="px-3 py-2 text-xs text-muted-foreground">Шинэ зураг</div>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-4 pt-4 border-t">
				<ConfirmDialog
					trigger={
						<Button type="button" variant="outline" className="text-destructive hover:text-destructive">
							Устгах
						</Button>
					}
					title="Эвент устгах уу?"
					description="Та энэ эвентийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй."
					confirmText="Тийм, устгах"
					cancelText="Үгүй"
					variant="destructive"
					onConfirm={handleDelete}
				/>

				<div className="flex items-center gap-2">
					<Button type="button" variant="secondary" onClick={() => router.back()}>
						Буцах
					</Button>
					<Button type="submit" disabled={saving}>
						{saving ? "Хадгалж байна..." : "Хадгалах"}
					</Button>
				</div>
			</div>
		</form>
	)
}
