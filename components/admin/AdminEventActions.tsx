"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, X, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type AdminEventActionsProps = {
	eventId: string
	currentStatus: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"
}

export function AdminEventActions({ eventId, currentStatus }: AdminEventActionsProps) {
	const router = useRouter()
	const [loading, setLoading] = React.useState<string | null>(null)

	async function handleStatusChange(newStatus: "PUBLISHED" | "CANCELLED" | "DRAFT") {
		setLoading(newStatus)
		try {
			const res = await fetch(`/api/admin/events/${eventId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			})

			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error || "Failed to update status")
			}

			router.refresh()
		} catch (error) {
			console.error("Status change error:", error)
			alert(error instanceof Error ? error.message : "Алдаа гарлаа")
		} finally {
			setLoading(null)
		}
	}

	async function handleDelete() {
		setLoading("delete")
		try {
			const res = await fetch(`/api/admin/events/${eventId}`, {
				method: "DELETE",
			})

			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.error || "Failed to delete event")
			}

			router.push("/admin/events")
			router.refresh()
		} catch (error) {
			console.error("Delete error:", error)
			alert(error instanceof Error ? error.message : "Устгахад алдаа гарлаа")
			setLoading(null)
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Publish/Approve button - only show if not already published */}
			{currentStatus !== "PUBLISHED" && (
				<Button
					onClick={() => handleStatusChange("PUBLISHED")}
					disabled={loading !== null}
					className="bg-green-600 hover:bg-green-700"
				>
					{loading === "PUBLISHED" ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Check className="mr-2 h-4 w-4" />
					)}
					Зөвшөөрөх
				</Button>
			)}

			{/* Cancel button - only show if published */}
			{currentStatus === "PUBLISHED" && (
				<ConfirmDialog
					trigger={
						<Button variant="secondary" disabled={loading !== null}>
							{loading === "CANCELLED" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<X className="mr-2 h-4 w-4" />
							)}
							Цуцлах
						</Button>
					}
					title="Эвент цуцлах уу?"
					description="Энэ эвентийг цуцлах уу? Оролцогчдод мэдэгдэл илгээгдэнэ."
					confirmText="Тийм, цуцлах"
					cancelText="Үгүй"
					variant="destructive"
					onConfirm={() => handleStatusChange("CANCELLED")}
				/>
			)}

			{/* Revert to draft - for cancelled or completed */}
			{(currentStatus === "CANCELLED" || currentStatus === "COMPLETED") && (
				<Button
					variant="secondary"
					onClick={() => handleStatusChange("DRAFT")}
					disabled={loading !== null}
				>
					{loading === "DRAFT" ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : null}
					Ноорог болгох
				</Button>
			)}

			{/* Delete button */}
			<ConfirmDialog
				trigger={
					<Button variant="destructive" disabled={loading !== null}>
						{loading === "delete" ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Trash2 className="mr-2 h-4 w-4" />
						)}
						Устгах
					</Button>
				}
				title="Эвент устгах уу?"
				description="Энэ үйлдлийг буцаах боломжгүй. Эвент болон түүний бүх мэдээлэл (оролцогчид, хадгалсан гэх мэт) бүрмөсөн устах болно."
				confirmText="Тийм, устгах"
				cancelText="Үгүй"
				variant="destructive"
				onConfirm={handleDelete}
			/>
		</div>
	)
}
