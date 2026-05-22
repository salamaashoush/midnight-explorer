import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	activeNetwork,
	NETWORK_LIST,
	type NetworkId,
	setNetwork,
} from "#/lib/networks";

// Switching networks rewrites the cookie and reloads, so SSR and every
// query re-resolve against the chosen indexer.
export function NetworkSwitcher() {
	const current = activeNetwork();

	return (
		<Select
			value={current.id}
			onValueChange={(value) => {
				setNetwork(value as NetworkId);
				window.location.assign("/");
			}}
		>
			<SelectTrigger size="sm" className="w-[116px]">
				<span className="flex items-center gap-1.5">
					<span className="size-1.5 rounded-full bg-primary" />
					<SelectValue />
				</span>
			</SelectTrigger>
			<SelectContent>
				{NETWORK_LIST.map((n) => (
					<SelectItem key={n.id} value={n.id}>
						{n.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
