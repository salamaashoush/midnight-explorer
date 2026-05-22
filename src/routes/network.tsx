import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock3, FileText, Server, Users } from "lucide-react";
import {
	EmptyState,
	formatTime,
	HashText,
	PageTitle,
	StatCard,
} from "#/components/bits";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { networkQuery } from "#/lib/indexer";

export const Route = createFileRoute("/network")({
	loader: ({ context }) => context.queryClient.ensureQueryData(networkQuery()),
	component: NetworkPage,
});

function NetworkPage() {
	const { data } = useSuspenseQuery(networkQuery());
	const epoch = data.currentEpochInfo;
	const pct =
		epoch.durationSeconds > 0
			? Math.min(100, (epoch.elapsedSeconds / epoch.durationSeconds) * 100)
			: 0;
	const remaining = Math.max(0, epoch.durationSeconds - epoch.elapsedSeconds);

	return (
		<div className="space-y-6">
			<PageTitle>Network</PageTitle>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard
					icon={Clock3}
					label="Current epoch"
					value={`#${epoch.epochNo.toLocaleString()}`}
				/>
				<StatCard
					icon={Server}
					label="Epoch length"
					value={`${Math.round(epoch.durationSeconds / 60)}m`}
				/>
				<StatCard
					icon={Users}
					label="Stake pool operators"
					value={data.spoCount.toLocaleString()}
				/>
				<StatCard
					icon={FileText}
					label="Governance changes"
					value={data.dParameterHistory.length.toLocaleString()}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Epoch progress</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Progress value={pct} />
					<div className="flex justify-between text-sm text-muted-foreground">
						<span>{fmtDuration(epoch.elapsedSeconds)} elapsed</span>
						<span className="font-medium text-foreground">
							{pct.toFixed(1)}%
						</span>
						<span>{fmtDuration(remaining)} remaining</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>D-parameter history</CardTitle>
					<p className="text-xs text-muted-foreground">
						Permissioned vs. registered block-producer candidate counts —
						governs the chain's validator mix.
					</p>
				</CardHeader>
				<CardContent>
					{data.dParameterHistory.length === 0 ? (
						<EmptyState title="No D-parameter changes recorded" />
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Block</TableHead>
									<TableHead>Changed at</TableHead>
									<TableHead className="text-right">Permissioned</TableHead>
									<TableHead className="text-right">Registered</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.dParameterHistory.map((d) => (
									<TableRow key={`${d.blockHeight}-${d.timestamp}`}>
										<TableCell>#{d.blockHeight.toLocaleString()}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatTime(d.timestamp)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{d.numPermissionedCandidates}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{d.numRegisteredCandidates}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Terms &amp; conditions history</CardTitle>
				</CardHeader>
				<CardContent>
					{data.termsAndConditionsHistory.length === 0 ? (
						<EmptyState title="No terms changes recorded" />
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Block</TableHead>
									<TableHead>Changed at</TableHead>
									<TableHead>Document</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.termsAndConditionsHistory.map((t) => (
									<TableRow key={`${t.blockHeight}-${t.hash}`}>
										<TableCell>#{t.blockHeight.toLocaleString()}</TableCell>
										<TableCell className="text-muted-foreground">
											{formatTime(t.timestamp)}
										</TableCell>
										<TableCell>
											<a
												href={t.url}
												target="_blank"
												rel="noreferrer"
												className="text-primary hover:underline"
											>
												{t.url}
											</a>
											{t.hash ? (
												<div className="mt-0.5">
													<HashText value={t.hash} chars={12} />
												</div>
											) : null}
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

function fmtDuration(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
