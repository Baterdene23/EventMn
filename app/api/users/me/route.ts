import { NextResponse } from "next/server"

import { prisma } from "@/lib/db/client"
import { getSession } from "@/lib/auth/session"

// GET /api/users/me - Get current user profile
export async function GET() {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: session.userId },
			select: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
				role: true,
				interests: true,
				twoFactorEnabled: true,
			},
		})

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		}

		return NextResponse.json(user)
	} catch (error) {
		console.error("Get user error:", error)
		return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
	}
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: Request) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	try {
		const body = await request.json()
		const { name, email, avatarUrl, interests } = body as {
			name?: string
			email?: string
			avatarUrl?: string
			interests?: string[]
		}

		// Validate email uniqueness if changing email
		if (email) {
			const existingUser = await prisma.user.findFirst({
				where: {
					email,
					NOT: { id: session.userId },
				},
			})

			if (existingUser) {
				return NextResponse.json(
					{ error: "Энэ имэйл хаяг бүртгэлтэй байна" },
					{ status: 400 }
				)
			}
		}

		const updatedUser = await prisma.user.update({
			where: { id: session.userId },
			data: {
				...(name !== undefined && { name }),
				...(email !== undefined && { email }),
				...(avatarUrl !== undefined && { avatarUrl }),
				...(interests !== undefined && { interests }),
			},
			select: {
				id: true,
				name: true,
				email: true,
				avatarUrl: true,
				role: true,
				interests: true,
				twoFactorEnabled: true,
			},
		})

		return NextResponse.json(updatedUser)
	} catch (error) {
		console.error("Update user error:", error)
		return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
	}
}
