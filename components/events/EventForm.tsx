"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { CATEGORIES, LOCATIONS } from "@/lib/data/categories"

export type EventCreateValues = {
	title: string
	description: string
	date: string
	startTime: string
	city: string
	category: string
	capacity: string
}

export function EventForm({ defaultValues }: { defaultValues?: Partial<EventCreateValues> }) {
	const router = useRouter()
	const [coverFile, setCoverFile] = React.useState<File | null>(null)
	const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string | null>(null)
	const [uploadProgress, setUploadProgress] = React.useState<string | null>(null)
	const [values, setValues] = React.useState<EventCreateValues>({
		title: defaultValues?.title ?? "",
		description: defaultValues?.description ?? "",
		date: defaultValues?.date ?? "",
		startTime: defaultValues?.startTime ?? "",
		city: defaultValues?.city ?? "",
		category: defaultValues?.category ?? "",
		capacity: defaultValues?.capacity ?? "",
	})
	const [saving, setSaving] = React.useState(false)

	React.useEffect(() => {
		return () => {
			if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
		}
	}, [coverPreviewUrl])

	function update<K extends keyof EventCreateValues>(key: K, val: EventCreateValues[K]) {
		setValues((prev) => ({ ...prev, [key]: val }))
	}

	async function uploadImage(file: File): Promise<string | null> {
		setUploadProgress("Зураг байршуулж байна...")
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
			setUploadProgress("Зураг амжилттай байршлаа!")
			return body.url
		} catch (error) {
			setUploadProgress(null)
			alert(error instanceof Error ? error.message : "Зураг байршуулахад алдаа гарлаа")
			return null
		}
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!values.title.trim()) {
			alert("Гарчиг оруулна уу")
			return
		}
		setSaving(true)
		try {
			// Upload image first if selected
			let imageSrc: string | undefined
			if (coverFile) {
				const uploadedUrl = await uploadImage(coverFile)
				if (!uploadedUrl) {
					setSaving(false)
					return
				}
				imageSrc = uploadedUrl
			}

			setUploadProgress("Эвент үүсгэж байна...")

			const res = await fetch("/api/events", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					title: values.title,
					description: values.description,
					date: values.date,
					startAt: values.date && values.startTime 
						? `${values.date}T${values.startTime}:00` 
						: undefined,
					city: values.city,
					category: values.category,
					capacity: values.capacity ? Number(values.capacity) : undefined,
					imageSrc,
				}),
			})

			if (res.status === 401) {
				router.push(`/login?returnTo=${encodeURIComponent("/events/create")}`)
				return
			}
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { error?: string } | null
				alert(body?.error ?? "Failed to create event")
				return
			}

			const body = (await res.json()) as { event: { id: string } }
			setUploadProgress(null)
			router.push(`/dashboard/events/${body.event.id}`)
			router.refresh()
		} finally {
			setSaving(false)
			setUploadProgress(null)
		}
	}

	return (
		<form onSubmit={onSubmit} className="grid gap-4">
			<div className="space-y-2">
				<div className="text-sm font-medium">Эвентийн нэр</div>
				<Input value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="Эвентийн нэр" />
			</div>
			<div className="space-y-3">
			    <div className="text-sm font-medium">Тайлбар</div>
				<Input value={values.description} onChange={(e) => update("description", e.target.value)} placeholder="Эвентийн тайлбар" />

			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<div className="text-sm font-medium">Огноо</div>
					<Input type="date" value={values.date} onChange={(e) => update("date", e.target.value)} />
				</div>
				<div className="space-y-2">
					<div className="text-sm font-medium">Эхлэх цаг</div>
					<Input type="time" value={values.startTime} onChange={(e) => update("startTime", e.target.value)} />
				</div>
			</div>
	<Select
				label="Хот"
				value={values.city}
				onChange={(e) => update("city", e.target.value)}
				options={LOCATIONS.map((loc) => ({
					value: loc.slug,
					label: loc.nameMn,
				}))}
			/>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<div className="text-sm font-medium">Байршил</div>
					<Input value={values.city} onChange={(e) => update("city", e.target.value)} placeholder="Эвент болох хаяг" />
				</div>

				<div className="space-y-2">
					<div className="text-sm font-medium">Оролцогчдын тоо</div>
					<Input 
						type="number" 
						value={values.capacity} 
						onChange={(e) => update("capacity", e.target.value)} 
						placeholder="Хязгааргүй бол хоосон орхино уу"
						min="1"
					/>
				</div>
			</div>

			<Select
				label="Эвентийн төрөл"
				value={values.category}
				onChange={(e) => update("category", e.target.value)}
				options={CATEGORIES.map((cat) => ({
					value: cat.slug,
					label: cat.labelMn,
				}))}
			/>

			<div className="space-y-2">
				<div className="text-sm font-medium">Зураг</div>
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
				<div className="text-xs text-muted-foreground">
					PNG/JPG/WebP. Зураг оруулна уу.
				</div>
				{coverPreviewUrl ? (
					<div className="overflow-hidden rounded-2xl border bg-card">
						<div className="relative h-56 w-full">
							<Image
								unoptimized
								src={coverPreviewUrl}
								alt="Cover preview"
								fill
								sizes="(max-width: 768px) 100vw, 700px"
								className="object-cover"
							/>
						</div>
						<div className="px-4 py-3 text-xs text-muted-foreground">Preview</div>
					</div>
				) : null}
			</div>

			<div className="flex items-center justify-end gap-2">
				<Button type="button" variant="secondary" onClick={() => router.back()}>
					Буцах
				</Button>
				<Button type="submit" disabled={saving}>
					{uploadProgress ?? (saving ? "Үүсгэж байна…" : "Эвент үүсгэх")}
				</Button>
			</div>
		</form>
	)
}

