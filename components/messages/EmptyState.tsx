interface EmptyStateProps {
	icon: React.ElementType
	title: string
	description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<Icon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
			<p className="max-w-sm text-center text-sm text-muted-foreground">
				{description}
			</p>
		</div>
	)
}
