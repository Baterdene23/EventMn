"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, Heart, Mail, Menu, Search, User, Plus, Settings, LogOut, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { BadgeCount, useBadgeCounts } from "@/components/badges/BadgeCount"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORIES, LOCATIONS } from "@/lib/data/categories"

const NAV_LINKS = [
	{ href: "/events", label: "Эвентүүд" },
]

type PublicAppBarProps = {
	isAuthed?: boolean
	userAvatarUrl?: string | null
}

export function PublicAppBar({ isAuthed = false, userAvatarUrl }: PublicAppBarProps) {
	const router = useRouter()
	const [searchQuery, setSearchQuery] = useState("")
	const { counts } = useBadgeCounts(isAuthed ? 30000 : 0) // Only poll if authenticated

	function handleSearch(e: React.FormEvent) {
		e.preventDefault()
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
		}
	}

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" })
		router.push("/")
		router.refresh()
	}

	return (
		<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
				{/* Logo */}
				<Link href="/" className="shrink-0 font-semibold">
					EventMN
				</Link>

				{/* Search Bar - Desktop */}
				<form onSubmit={handleSearch} className="hidden flex-1 md:block">
					<div className="relative max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Эвент хайх..."
							className="pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</form>

				{/* Desktop Nav */}
				<nav className="hidden items-center gap-1 md:flex">
					{NAV_LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
						>
							{link.label}
						</Link>
					))}
					
					{/* Browse Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="text-muted-foreground">
								Ангилал
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
								Төрөл
							</div>
							{CATEGORIES.slice(0, 5).map((cat) => (
								<DropdownMenuItem key={cat.slug} asChild>
									<Link href={`/c/${cat.slug}`}>{cat.labelMn}</Link>
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
								Байршил
							</div>
							{LOCATIONS.slice(0, 4).map((loc) => (
								<DropdownMenuItem key={loc.slug} asChild>
									<Link href={`/d/${loc.slug}`}>{loc.nameMn}</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>

				{/* Right Actions */}
				<div className="flex items-center gap-2">
					{isAuthed ? (
						<>
							<Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
								<Link href="/events/create" aria-label="Эвент үүсгэх" title="Эвент үүсгэх">
									<Plus className="h-5 w-5" />
								</Link>
							</Button>
							<Button variant="ghost" size="icon" className="relative hidden sm:flex" asChild>
								<Link href="/dashboard/messages" aria-label="Мессеж" title="Мессеж">
									<Mail className="h-5 w-5" />
									<BadgeCount count={counts.messages} />
								</Link>
							</Button>
							<Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
								<Link href="/likes" aria-label="Хадгалсан" title="Хадгалсан">
									<Heart className="h-5 w-5" />
								</Link>
							</Button>
							<Button variant="ghost" size="icon" className="relative hidden sm:flex" asChild>
								<Link href="/dashboard/notification" aria-label="Мэдэгдэл" title="Мэдэгдэл">
									<Bell className="h-5 w-5" />
									<BadgeCount count={counts.notifications} />
								</Link>
							</Button>
							
							{/* User Menu */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
										{userAvatarUrl ? (
											<Image
												src={userAvatarUrl}
												alt="Profile"
												width={32}
												height={32}
												className="h-8 w-8 rounded-full object-cover"
											/>
										) : (
											<User className="h-5 w-5" />
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem asChild>
										<Link href="/dashboard" className="flex items-center gap-2">
											<LayoutDashboard className="mr-2 h-4 w-4" />
										Хянах самбар</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/dashboard/settings" className="flex items-center gap-2">
										<Settings className="mr-2 h-4 w-4" />
										Профайл засах</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<ConfirmDialog
										trigger={
											<DropdownMenuItem
												onSelect={(e) => e.preventDefault()}
												className="cursor-pointer text-destructive focus:text-destructive"
											>
												<LogOut className ="mr-2 h-4 w-4" />
												Гарах
											</DropdownMenuItem>
										}
										title="Гарах уу?"
										description="Та системээс гарахдаа итгэлтэй байна уу?"
										confirmText="Тийм, гарах"
										cancelText="Үгүй"
										variant="destructive"
										onConfirm={handleLogout}
									/>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<>
							<Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
								<Link href="/login">Нэвтрэх</Link>
							</Button>
							<Button size="sm" asChild>
								<Link href="/register">Бүртгүүлэх</Link>
							</Button>
						</>
					)}

					{/* Mobile Menu */}
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Цэс</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-72">
							<SheetHeader>
								<SheetTitle>EventMN</SheetTitle>
							</SheetHeader>
							<div className="mt-6 space-y-6">
								{/* Mobile Search */}
								<form onSubmit={handleSearch}>
									<div className="relative">
										<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											type="search"
											placeholder="Эвент хайх..."
											className="pl-9"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
									</div>
								</form>

								{/* Mobile Nav */}
								<nav className="space-y-1">
									{NAV_LINKS.map((link) => (
										<Link
											key={link.href}
											href={link.href}
											className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
										>
											{link.label}
										</Link>
									))}
									<Link
										href="/events/create"
										className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
									>
										Эвент үүсгэх
									</Link>
								</nav>

								{/* Categories */}
								<div>
									<div className="px-3 text-xs font-medium text-muted-foreground">
										Ангилал
									</div>
									<nav className="mt-2 space-y-1">
										{CATEGORIES.slice(0, 6).map((cat) => (
											<Link
												key={cat.slug}
												href={`/b/ulaanbaatar/${cat.slug}`}
												className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
											>
												{cat.labelMn}
											</Link>
										))}
									</nav>
								</div>

								{/* Locations */}
								<div>
									<div className="px-3 text-xs font-medium text-muted-foreground">
										Байршил
									</div>
									<nav className="mt-2 space-y-1">
										{LOCATIONS.map((loc) => (
											<Link
												key={loc.slug}
												href={`/d/${loc.slug}`}
												className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
											>
												{loc.nameMn}
											</Link>
										))}
									</nav>
								</div>

								{/* Auth */}
								{!isAuthed && (
									<div className="space-y-2 pt-4">
										<Button className="w-full" asChild>
											<Link href="/register">Бүртгүүлэх</Link>
										</Button>
										<Button variant="outline" className="w-full" asChild>
											<Link href="/login">Нэвтрэх</Link>
										</Button>
									</div>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	)
}
