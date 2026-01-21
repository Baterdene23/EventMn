import { put } from '@vercel/blob';
import { NextResponse } from "next/server"


import { getSession } from "@/lib/auth/session"

export async function POST(request: Request): Promise<NextResponse> {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const formData = await request.formData()
		const file = formData.get("file") 

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 })
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
				{ status: 400 }
			)
		}

		// Validate file size (max 5MB)
		const maxSize = 5 * 1024 * 1024
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 5MB." },
				{ status: 400 }
			)
		}

		// Create unique filename
		const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
		const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

		// Ensure uploads directory exists
		const blob = await put(`uploads/${uniqueName}`, file.stream(), {
			access: 'public',
			contentType: file.type,
		});

		// Write file to disk
		{/*const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)
		const filePath = path.join(uploadsDir, uniqueName)
		await writeFile(filePath, buffer)

		// Return the public URL
		const url = `/uploads/${uniqueName}`*/}

		return NextResponse.json({ url:blob.url }, { status: 201 })
	} catch (error) {
		console.error("Upload error:", error)
		return NextResponse.json({ error: "Upload failed" }, { status: 500 })
	}
}
