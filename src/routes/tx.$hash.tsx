import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Boxes,
	FileCode2,
	FileText,
} from "lucide-react";
import {
	CodeBlock,
	CopyButton,
	EmptyState,
	formatTime,
	HashText,
	InfoCard,
	InfoRow,
	PageTitle,
	StatusBadge,
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
import {
	formatAmount,
	NATIVE_TOKEN,
	txQuery,
	type UnshieldedUtxo,
} from "#/lib/indexer";
import { decodeTransaction } from "#/lib/server";

const RAW_LIMIT = 4096;

export const Route = createFileRoute("/tx/$hash")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(txQuery(params.hash)),
	component: TxPage,
});

function TxPage() {
	const { hash } = Route.useParams();
	const { data: tx } = useSuspenseQuery(txQuery(hash));

	if (!tx) {
		return (
			<Card>
				<CardContent>
					<EmptyState icon={FileText} title="Transaction not found">
						No transaction matched{" "}
						<span className="font-mono">{hash.slice(0, 16)}…</span>. It may be a{" "}
						<Link
							to="/block/$id"
							params={{ id: hash }}
							className="text-primary hover:underline"
						>
							block
						</Link>{" "}
						or{" "}
						<Link
							to="/contract/$address"
							params={{ address: hash }}
							className="text-primary hover:underline"
						>
							contract
						</Link>{" "}
						instead.
					</EmptyState>
				</CardContent>
			</Card>
		);
	}

	const raw = tx.raw ?? "";
	const rawClipped = raw.length > RAW_LIMIT;
	const created = tx.unshieldedCreatedOutputs ?? [];
	const spent = tx.unshieldedSpentOutputs ?? [];
	const actions = tx.contractActions ?? [];

	return (
		<div className="space-y-6">
			<PageTitle badge={<StatusBadge status={tx.transactionResult?.status} />}>
				Transaction
			</PageTitle>

			<InfoCard title="Overview">
				<dl>
					<InfoRow label="Hash">
						<HashText value={tx.hash} />
					</InfoRow>
					<InfoRow label="Status">
						<StatusBadge status={tx.transactionResult?.status} />
					</InfoRow>
					<InfoRow label="Fees paid">
						{tx.fees ? (
							<span className="tabular-nums">
								{formatAmount(tx.fees.paidFees, NATIVE_TOKEN)}{" "}
								<span className="text-muted-foreground">
									({tx.fees.paidFees} SPECK)
								</span>
							</span>
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</InfoRow>
					<InfoRow label="Block">
						{tx.block ? (
							<Link
								to="/block/$id"
								params={{ id: String(tx.block.height) }}
								className="text-primary hover:underline"
							>
								#{tx.block.height.toLocaleString()}
							</Link>
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</InfoRow>
					<InfoRow label="Timestamp">
						{tx.block ? (
							formatTime(tx.block.timestamp)
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</InfoRow>
					<InfoRow label="Protocol version">{tx.protocolVersion}</InfoRow>
					{tx.merkleTreeRoot ? (
						<InfoRow label="Zswap Merkle root">
							<HashText value={tx.merkleTreeRoot} chars={16} />
						</InfoRow>
					) : null}
				</dl>
			</InfoCard>

			{created.length > 0 || spent.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Unshielded transfers</CardTitle>
						<p className="text-xs text-muted-foreground">
							Public token movements. Shielded transfers in this transaction, if
							any, stay private.
						</p>
					</CardHeader>
					<CardContent className="space-y-5">
						<UtxoGroup dir="in" title="Inputs — spent" utxos={spent} />
						<UtxoGroup dir="out" title="Outputs — created" utxos={created} />
					</CardContent>
				</Card>
			) : null}

			{actions.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Contract interactions
							<Badge variant="secondary" className="font-normal">
								{actions.length}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{actions.map((a) => (
							<div
								key={`${a.__typename}-${a.address}`}
								className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2"
							>
								<Badge
									variant="outline"
									className="gap-1.5 border-primary/30 bg-primary/10 text-primary"
								>
									<FileCode2 className="size-3" />
									{a.__typename.replace("Contract", "")}
								</Badge>
								{a.entryPoint ? (
									<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-primary/80">
										{a.entryPoint}
									</code>
								) : null}
								<HashText
									value={a.address}
									to={`/contract/${a.address}`}
									chars={14}
								/>
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			{tx.identifiers && tx.identifiers.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							Identifiers
							<Badge variant="secondary" className="font-normal">
								{tx.identifiers.length}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1">
						{tx.identifiers.map((id) => (
							<div
								key={id}
								className="rounded-md border border-border bg-muted/40 px-3 py-2"
							>
								<HashText value={id} chars={24} />
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			{raw ? <DecodedTransaction raw={raw} /> : null}

			{raw ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between gap-2">
							<span>Raw transaction</span>
							<span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
								{raw.length.toLocaleString()} hex chars
								<CopyButton text={raw} />
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<CodeBlock className="max-h-72 break-all whitespace-pre-wrap">
							{rawClipped ? raw.slice(0, RAW_LIMIT) : raw}
						</CodeBlock>
						{rawClipped ? (
							<p className="mt-2 text-xs text-muted-foreground">
								Showing first {RAW_LIMIT.toLocaleString()} of{" "}
								{raw.length.toLocaleString()} characters — use copy for the full
								payload.
							</p>
						) : null}
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

// Server-side ledger decode of the raw transaction bytes — the WASM
// ledger only runs in Node, so this hits a server function over RPC.
function DecodedTransaction({ raw }: { raw: string }) {
	const { data, error, isPending } = useQuery({
		queryKey: ["decode-tx", raw.slice(0, 64)],
		queryFn: () => decodeTransaction({ data: raw }),
		retry: false,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileCode2 className="size-4 text-primary" />
					Decoded transaction
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<Skeleton className="h-64 w-full" />
				) : error ? (
					<p className="text-sm text-rose-400">
						{error instanceof Error ? error.message : "Failed to decode"}
					</p>
				) : !data ? (
					<EmptyState icon={Boxes} title="Could not decode">
						This transaction shape is not a standard signed / proven / bound
						transaction.
					</EmptyState>
				) : (
					<CodeBlock className="max-h-[34rem] whitespace-pre">
						{data.repr}
					</CodeBlock>
				)}
			</CardContent>
		</Card>
	);
}

function UtxoGroup({
	dir,
	title,
	utxos,
}: {
	dir: "in" | "out";
	title: string;
	utxos: UnshieldedUtxo[];
}) {
	const Icon = dir === "in" ? ArrowUpRight : ArrowDownLeft;
	const tone = dir === "in" ? "text-rose-400" : "text-emerald-400";
	return (
		<div>
			<div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				<Icon className={`size-3.5 ${tone}`} />
				{title} ({utxos.length})
			</div>
			{utxos.length === 0 ? (
				<p className="text-sm text-muted-foreground">None.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Owner</TableHead>
							<TableHead className="w-[150px]">Token</TableHead>
							<TableHead className="w-[200px] text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{utxos.map((u, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static list, owner+token may repeat
							<TableRow key={`${u.owner}-${u.tokenType}-${i}`}>
								<TableCell>
									<HashText value={u.owner} chars={12} />
								</TableCell>
								<TableCell>
									{u.tokenType === NATIVE_TOKEN ? (
										<Badge
											variant="outline"
											className="border-primary/30 bg-primary/10 text-primary"
										>
											NIGHT
										</Badge>
									) : (
										<HashText value={u.tokenType} chars={6} copy={false} />
									)}
								</TableCell>
								<TableCell className={`text-right tabular-nums ${tone}`}>
									{dir === "in" ? "−" : "+"}
									{formatAmount(u.value, u.tokenType)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
