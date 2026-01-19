"use client"

import * as React from "react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ConfirmDialogProps = {
	trigger: React.ReactNode
	title: string
	description: string
	confirmText?: string
	cancelText?: string
	variant?: "default" | "destructive"
	onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmText = "Тийм",
	cancelText = "Үгүй",
	variant = "default",
	onConfirm,
}: ConfirmDialogProps) {
	const [open, setOpen] = React.useState(false)
	const [loading, setLoading] = React.useState(false)

	async function handleConfirm() {
		setLoading(true)
		try {
			await onConfirm()
			setOpen(false)
		} finally {
			setLoading(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault()
							handleConfirm()
						}}
						disabled={loading}
						className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
					>
						{loading ? "Түр хүлээнэ үү..." : confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
