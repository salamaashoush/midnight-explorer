import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Boxes } from "lucide-react";
import {
	EmptyState,
	formatTime,
	HashText,
	InfoCard,
	InfoRow,
	PageTitle,
	relativeTime,
	StatusBadge,
} from "#/components/bits";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { blockQuery } from "#/lib/indexer";

export const Route = createFileRoute("/block/$id")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(blockQuery(params.id)),
	component: BlockPage,
});

function BlockPage() {
	const { id } = Route.useParams();
	const { data: block } = useSuspenseQuery(blockQuery(id));

	if (!block) {
		return (
			<Card>
				<CardContent>
					<EmptyState icon={Boxes} title="Block not found">
						No block matched "{id}".
					</EmptyState>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<PageTitle
					badge={
						<Badge variant="secondary" className="font-normal">
							{relativeTime(block.timestamp)}
						</Badge>
					}
				>
					Block #{block.height.toLocaleString()}
				</PageTitle>
				<div className="flex gap-2">
					<Button
						asChild
						variant="outline"
						size="sm"
						disabled={block.height === 0}
					>
						<Link
							to="/block/$id"
							params={{ id: String(Math.max(0, block.height - 1)) }}
						>
							<ArrowLeft className="size-4" /> Prev
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link to="/block/$id" params={{ id: String(block.height + 1) }}>
							Next <ArrowRight className="size-4" />
						</Link>
					</Button>
				</div>
			</div>

			<InfoCard title="Overview">
				<dl>
					<InfoRow label="Height">#{block.height.toLocaleString()}</InfoRow>
					<InfoRow label="Hash">
						<HashText value={block.hash} />
					</InfoRow>
					<InfoRow label="Timestamp">
						{formatTime(block.timestamp)}{" "}
						<span className="text-muted-foreground">
							({relativeTime(block.timestamp)})
						</span>
					</InfoRow>
					<InfoRow label="Author">
						{block.author ? (
							<HashText value={block.author} chars={16} />
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</InfoRow>
					<InfoRow label="Protocol version">{block.protocolVersion}</InfoRow>
					<InfoRow label="Transactions">{block.transactions.length}</InfoRow>
				</dl>
			</InfoCard>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						Transactions
						<Badge variant="secondary" className="font-normal">
							{block.transactions.length}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{block.transactions.length === 0 ? (
						<EmptyState title="No transactions in this block" />
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Hash</TableHead>
									<TableHead className="w-[160px]">Status</TableHead>
									<TableHead className="w-[140px]">Fees (SPECK)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{block.transactions.map((tx) => (
									<TableRow key={tx.hash}>
										<TableCell>
											<HashText
												value={tx.hash}
												to={`/tx/${tx.hash}`}
												chars={12}
											/>
										</TableCell>
										<TableCell>
											<StatusBadge status={tx.transactionResult?.status} />
										</TableCell>
										<TableCell className="tabular-nums text-muted-foreground">
											{tx.fees?.paidFees ?? "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
