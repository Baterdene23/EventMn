import { Skeleton } from "@/components/ui/skeleton"

const SKELETON_ITEMS = ["skel-1", "skel-2", "skel-3", "skel-4"]

export function ConversationListSkeleton() {
	return (
		<div className="space-y-2 p-3">
			{SKELETON_ITEMS.map((id) => (
				<div key={id} className="flex items-start gap-3 p-3">
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-2/3" />
					</div>
				</div>
			))}
		</div>
	)
}
