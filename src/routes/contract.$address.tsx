import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, FileCode2 } from "lucide-react";
import {
	CodeBlock,
	EmptyState,
	HashText,
	InfoCard,
	InfoRow,
	PageTitle,
} from "#/components/bits";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { contractQuery } from "#/lib/indexer";
import { getContractState } from "#/lib/server";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/contract/$address")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(contractQuery(params.address)),
	component: ContractPage,
});

const ACTION: Record<string, { label: string; className: string }> = {
	ContractDeploy: {
		label: "Deploy",
		className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
	},
	ContractCall: {
		label: "Call",
		className: "border-primary/30 bg-primary/10 text-primary",
	},
	ContractUpdate: {
		label: "Maintenance update",
		className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
	},
};

const STATE_LIMIT = 4096;

function ContractPage() {
	const { address } = Route.useParams();
	const { data: action } = useSuspenseQuery(contractQuery(address));

	if (!action) {
		return (
			<Card>
				<CardContent>
					<EmptyState icon={Boxes} title="Contract not found">
						No contract action matched{" "}
						<span className="font-mono">{address.slice(0, 16)}…</span>.
					</EmptyState>
				</CardContent>
			</Card>
		);
	}

	const meta = ACTION[action.__typename] ?? {
		label: action.__typename,
		className: "",
	};
	const stateClipped = action.state.length > STATE_LIMIT;

	return (
		<div className="space-y-6">
			<PageTitle
				badge={
					<Badge
						variant="outline"
						className={cn("font-medium", meta.className)}
					>
						{meta.label}
					</Badge>
				}
			>
				Contract
			</PageTitle>

			<InfoCard title="Latest action">
				<dl>
					<InfoRow label="Address">
						<HashText value={action.address} />
					</InfoRow>
					<InfoRow label="Action type">{meta.label}</InfoRow>
					{action.entryPoint ? (
						<InfoRow label="Entry point">
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-primary">
								{action.entryPoint}
							</code>
						</InfoRow>
					) : null}
					<InfoRow label="Transaction">
						<HashText
							value={action.transaction.hash}
							to={`/tx/${action.transaction.hash}`}
						/>
					</InfoRow>
					{action.transaction.block ? (
						<InfoRow label="Block">
							<Link
								to="/block/$id"
								params={{ id: String(action.transaction.block.height) }}
								className="text-primary hover:underline"
							>
								#{action.transaction.block.height.toLocaleString()}
							</Link>
						</InfoRow>
					) : null}
				</dl>
			</InfoCard>

			<DecodedState address={action.address} />

			<Card>
				<CardHeader>
					<CardTitle>Unshielded balances</CardTitle>
				</CardHeader>
				<CardContent>
					{action.unshieldedBalances.length === 0 ? (
						<EmptyState title="No unshielded token balances" />
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Token type</TableHead>
									<TableHead className="w-[200px]">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{action.unshieldedBalances.map((b) => (
									<TableRow key={b.tokenType}>
										<TableCell>
											<HashText value={b.tokenType} chars={16} />
										</TableCell>
										<TableCell className="tabular-nums">{b.amount}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between gap-2">
						<span>Raw serialized state</span>
						<span className="text-xs font-normal text-muted-foreground">
							{action.state.length.toLocaleString()} hex chars
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<CodeBlock className="max-h-60 break-all whitespace-pre-wrap">
						{stateClipped ? action.state.slice(0, STATE_LIMIT) : action.state}
					</CodeBlock>
				</CardContent>
			</Card>
		</div>
	);
}

// Decoded via the official midnight-js provider, server-side (the
// provider depends on the Node `ws` package).
function DecodedState({ address }: { address: string }) {
	const { data, error, isPending } = useQuery({
		queryKey: ["contract-state", address],
		queryFn: () => getContractState({ data: address }),
		retry: false,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileCode2 className="size-4 text-primary" />
					Public ledger state
				</CardTitle>
				<p className="text-xs text-muted-foreground">
					Current public on-chain state of the contract. Private state never
					leaves the user's device.
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{isPending ? (
					<div className="space-y-2">
						<Skeleton className="h-7 w-64" />
						<Skeleton className="h-24 w-full" />
					</div>
				) : error ? (
					<p className="text-sm text-rose-400">
						{error instanceof Error ? error.message : "Failed to decode state"}
					</p>
				) : !data ? (
					<EmptyState title="Provider returned no state for this address" />
				) : (
					<>
						<div>
							<div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Circuit entry points ({data.operations.length})
							</div>
							{data.operations.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No entry points reported.
								</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{data.operations.map((op) => (
										<Badge
											key={op}
											variant="outline"
											className="gap-1.5 border-primary/30 bg-primary/10 font-mono text-[13px] text-primary/80"
										>
											<FileCode2 className="size-3" />
											{op}
										</Badge>
									))}
								</div>
							)}
						</div>
						{data.stateRepr ? (
							<div>
								<div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Ledger state
								</div>
								<CodeBlock className="max-h-[34rem] whitespace-pre">
									{data.stateRepr}
								</CodeBlock>
							</div>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}
