import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"
import { CATEGORIES } from "@/lib/data/categories"

// Valid category slugs
const validSlugs = new Set(CATEGORIES.map((c) => c.slug))

// GET /api/users/me/interests - Get user's interests
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.userId },
			select: { interests: true },
		})

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		}

		return NextResponse.json({ interests: user.interests })
	} catch (error) {
		console.error("Get interests error:", error)
		return NextResponse.json({ error: "Failed to get interests" }, { status: 500 })
	}
}

// PUT /api/users/me/interests - Update user's interests
export async function PUT(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json()
		const { interests } = body as { interests?: string[] }

		if (!interests || !Array.isArray(interests)) {
			return NextResponse.json(
				{ error: "interests must be an array of category slugs" },
				{ status: 400 }
			)
		}

		// Validate all interests are valid category slugs
		const validInterests = interests.filter((i) => validSlugs.has(i))

		const user = await prisma.user.update({
			where: { id: session.userId },
			data: { interests: validInterests },
			select: { interests: true },
		})

		return NextResponse.json({ interests: user.interests })
	} catch (error) {
		console.error("Update interests error:", error)
		return NextResponse.json({ error: "Failed to update interests" }, { status: 500 })
	}
}
