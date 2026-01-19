import { AdminShell } from "@/components/layout/AdminShell"
import { Footer } from "@/components/layout/Footer"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<AdminShell>
				{children}
			</AdminShell>
			<Footer />
		</>
	)
}
