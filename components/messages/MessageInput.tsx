"use client"

import { Send } from "lucide-react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

interface MessageInputProps {
	onSend: (content: string) => Promise<void>
	onTyping?: () => void
	disabled?: boolean
	placeholder?: string
}

export function MessageInput({
	onSend,
	onTyping,
	disabled = false,
	placeholder = "Мессеж бичих...",
}: MessageInputProps) {
	const [message, setMessage] = useState("")
	const [sending, setSending] = useState(false)

	const handleSend = useCallback(async () => {
		if (!message.trim() || sending || disabled) return

		const content = message.trim()
		setMessage("")
		setSending(true)

		try {
			await onSend(content)
		} catch {
			// Restore message on error
			setMessage(content)
		} finally {
			setSending(false)
		}
	}, [message, sending, disabled, onSend])

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value)
		// Trigger typing indicator
		if (onTyping && e.target.value.length > 0) {
			onTyping()
		}
	}

	return (
		<div className="flex gap-2 border-t pt-4">
			<Input
				value={message}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={sending || disabled}
				className="flex-1"
			/>
			<Button
				onClick={handleSend}
				disabled={!message.trim() || sending || disabled}
				size="icon"
			>
				<Send className="h-4 w-4" />
			</Button>
		</div>
	)
}
