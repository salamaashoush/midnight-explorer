import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { TxStatus } from "#/lib/indexer";
import { cn } from "#/lib/utils";

// --- time --------------------------------------------------------------------

export function relativeTime(unixMs: number): string {
	const s = Math.round((Date.now() - unixMs) / 1000);
	if (s < 60) return `${s}s ago`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.round(h / 24)}d ago`;
}

export function formatTime(unixMs: number): string {
	return new Date(unixMs).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "medium",
	});
}

// --- copy --------------------------------------------------------------------

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
			aria-label="Copy"
			onClick={() => {
				navigator.clipboard?.writeText(text).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1200);
				});
			}}
		>
			{copied ? (
				<Check className="size-3.5 text-emerald-500" />
			) : (
				<Copy className="size-3.5" />
			)}
		</Button>
	);
}

// --- hashes ------------------------------------------------------------------

function shorten(value: string, chars: number): string {
	return chars > 0 && value.length > chars * 2
		? `${value.slice(0, chars)}…${value.slice(-chars)}`
		: value;
}

export function HashText({
	value,
	to,
	chars = 0,
	copy = true,
}: {
	value: string;
	to?: string;
	chars?: number;
	copy?: boolean;
}) {
	const text = shorten(value, chars);
	return (
		<span className="inline-flex items-center gap-1">
			{to ? (
				<Link
					to={to}
					className="font-mono text-[13px] text-primary transition-colors hover:text-primary/80 hover:underline"
				>
					{text}
				</Link>
			) : (
				<span className="font-mono text-[13px] text-foreground/90">{text}</span>
			)}
			{copy ? <CopyButton text={value} /> : null}
		</span>
	);
}

// --- status ------------------------------------------------------------------

const STATUS_STYLE: Record<TxStatus, string> = {
	SUCCESS: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
	PARTIAL_SUCCESS: "border-amber-500/30 bg-amber-500/10 text-amber-400",
	FAILURE: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

export function StatusBadge({ status }: { status?: TxStatus }) {
	if (!status) return <span className="text-sm text-muted-foreground">—</span>;
	return (
		<Badge
			variant="outline"
			className={cn("gap-1.5 font-medium", STATUS_STYLE[status])}
		>
			<span className="size-1.5 rounded-full bg-current" />
			{status.replace("_", " ")}
		</Badge>
	);
}

// --- stat card ---------------------------------------------------------------

export function StatCard({
	icon: Icon,
	label,
	value,
	hint,
}: {
	icon: ComponentType<{ className?: string }>;
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<Card className="gap-0 py-4">
			<CardContent className="px-4">
				<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
					<Icon className="size-3.5" />
					{label}
				</div>
				<div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
					{value}
				</div>
				{hint ? (
					<div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
				) : null}
			</CardContent>
		</Card>
	);
}

// --- definition rows ---------------------------------------------------------

export function InfoCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

export function InfoRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="grid grid-cols-1 gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[200px_1fr] sm:gap-4">
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className="min-w-0 break-all text-sm text-foreground">{children}</dd>
		</div>
	);
}

// --- code block --------------------------------------------------------------

export function CodeBlock({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<pre
			className={cn(
				"overflow-auto rounded-lg border border-border bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground",
				className,
			)}
		>
			{children}
		</pre>
	);
}

// --- empty state -------------------------------------------------------------

export function EmptyState({
	icon: Icon,
	title,
	children,
}: {
	icon?: ComponentType<{ className?: string }>;
	title: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-2 py-12 text-center">
			{Icon ? <Icon className="size-8 text-muted-foreground/50" /> : null}
			<p className="text-sm font-medium text-foreground">{title}</p>
			{children ? (
				<p className="max-w-md text-sm text-muted-foreground">{children}</p>
			) : null}
		</div>
	);
}

export function PageTitle({
	children,
	badge,
}: {
	children: ReactNode;
	badge?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<h1 className="text-2xl font-semibold tracking-tight">{children}</h1>
			{badge}
		</div>
	);
}
