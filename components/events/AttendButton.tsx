"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type AttendButtonProps = {
	eventId: string
	isAuthed: boolean
	initialAttending?: boolean
}

export function AttendButton({ eventId, isAuthed, initialAttending = false }: AttendButtonProps) {
	const router = useRouter()
	const [isAttending, setIsAttending] = React.useState(initialAttending)
	const [loading, setLoading] = React.useState(false)

	async function handleAttend() {
		if (!isAuthed) {
			router.push(`/login?returnTo=/events/${eventId}`)
			return
		}

		setLoading(true)
		try {
			const res = await fetch(`/api/events/${eventId}/attend`, { method: "POST" })
			const data = await res.json()

			if (res.ok) {
				setIsAttending(true)
				router.refresh()
			} else {
				alert(data.error || "Алдаа гарлаа")
			}
		} catch {
			alert("Сүлжээний алдаа")
		} finally {
			setLoading(false)
		}
	}

	async function handleCancel() {
		setLoading(true)
		try {
			const res = await fetch(`/api/events/${eventId}/attend`, { method: "DELETE" })
			const data = await res.json()

			if (res.ok) {
				setIsAttending(false)
				router.refresh()
			} else {
				alert(data.error || "Алдаа гарлаа")
			}
		} catch {
			alert("Сүлжээний алдаа")
		} finally {
			setLoading(false)
		}
	}

	if (isAttending) {
		return (
			<ConfirmDialog
				trigger={
					<Button
						className="w-full"
						size="lg"
						variant="outline"
						disabled={loading}
					>
						{loading ? "Түр хүлээнэ үү..." : "Бүртгэл цуцлах"}
					</Button>
				}
				title="Бүртгэл цуцлах уу?"
				description="Та энэ эвентэд оролцохоо цуцлахдаа итгэлтэй байна уу?"
				confirmText="Тийм, цуцлах"
				cancelText="Үгүй"
				variant="destructive"
				onConfirm={handleCancel}
			/>
		)
	}

	return (
		<Button
			className="w-full"
			size="lg"
			onClick={handleAttend}
			disabled={loading}
		>
			{loading ? "Түр хүлээнэ үү..." : "Оролцох"}
		</Button>
	)
}
