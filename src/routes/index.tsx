import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Boxes, Clock3, Radio } from "lucide-react";
import { HashText, relativeTime, StatCard } from "#/components/bits";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { latestBlocksQuery } from "#/lib/indexer";
import { useLiveBlocks } from "#/lib/live";

export const Route = createFileRoute("/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(latestBlocksQuery(20)),
	component: Home,
});

function Home() {
	const { data: blocks } = useSuspenseQuery(latestBlocksQuery(20));
	const live = useLiveBlocks(20);
	const tip = blocks[0];
	const totalTx = blocks.reduce((n, b) => n + b.transactions.length, 0);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard
					icon={Boxes}
					label="Latest block"
					value={tip ? `#${tip.height.toLocaleString()}` : "—"}
				/>
				<StatCard
					icon={Clock3}
					label="Last block"
					value={tip ? relativeTime(tip.timestamp) : "—"}
				/>
				<StatCard
					icon={Activity}
					label="Txns / 20 blocks"
					value={totalTx.toLocaleString()}
				/>
				<StatCard
					icon={Radio}
					label="Connection"
					value={live ? "Live" : "Polling"}
					hint={live ? "WebSocket stream" : "refresh every 6s"}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Latest blocks
						<Badge variant="secondary" className="font-normal">
							{blocks.length}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[140px]">Height</TableHead>
								<TableHead className="w-[120px]">Age</TableHead>
								<TableHead className="w-[80px]">Txns</TableHead>
								<TableHead>Hash</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{blocks.map((b) => (
								<TableRow key={b.hash}>
									<TableCell>
										<Link
											to="/block/$id"
											params={{ id: String(b.height) }}
											className="font-medium text-primary hover:text-primary/80 hover:underline"
										>
											#{b.height.toLocaleString()}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{relativeTime(b.timestamp)}
									</TableCell>
									<TableCell>
										{b.transactions.length > 0 ? (
											<Badge variant="secondary">{b.transactions.length}</Badge>
										) : (
											<span className="text-muted-foreground">0</span>
										)}
									</TableCell>
									<TableCell>
										<HashText
											value={b.hash}
											to={`/block/${b.hash}`}
											chars={10}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
