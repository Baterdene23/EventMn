import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

const navItems = [
	{ href: "/admin", label: "Admin" },
	{ href: "/admin/events", label: "Events" },
	{ href: "/admin/users", label: "Users" },
	{ href: "/admin/reports", label: "Reports" },
]

interface AdminShellProps {
	children: ReactNode
	className?: string
}

export function AdminShell({ children, className }: AdminShellProps) {
	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
					<Link href="/" className="text-sm font-semibold">
						EventMN
					</Link>
					<nav className="flex items-center gap-4 text-sm text-muted-foreground">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="hover:text-foreground"
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
			</header>
			<main className={cn("mx-auto w-full max-w-6xl flex-1 px-4 py-8", className)}>
				{children}
			</main>
		</div>
	)
}
