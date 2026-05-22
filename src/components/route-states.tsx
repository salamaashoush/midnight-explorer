import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { EmptyState } from "#/components/bits";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

export function NotFound() {
	return (
		<Card>
			<CardContent>
				<EmptyState icon={Compass} title="Page not found">
					That route does not exist on the explorer.
				</EmptyState>
				<div className="flex justify-center">
					<Button asChild variant="outline" size="sm">
						<Link to="/">Back to latest blocks</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export function PagePending() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-8 w-48" />
			<Card>
				<CardContent className="space-y-3 py-6">
					{[0, 1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-6 w-full" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
