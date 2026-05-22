import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";

// Routes any query string: digits → block height, otherwise the
// /search route probes tx → block → contract and redirects.
export function SearchBox() {
	const navigate = useNavigate();
	const [q, setQ] = useState("");

	function submit(e: React.FormEvent) {
		e.preventDefault();
		const value = q.trim();
		if (!value) return;
		if (/^\d+$/.test(value)) {
			navigate({ to: "/block/$id", params: { id: value } });
		} else {
			navigate({ to: "/search", search: { q: value } });
		}
	}

	return (
		<form onSubmit={submit} className="flex w-full gap-2">
			<div className="relative w-full">
				<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search block height, block / tx hash, or contract address"
					className="pl-9 font-mono text-[13px]"
				/>
			</div>
			<Button type="submit" className="shrink-0">
				Search
			</Button>
		</form>
	);
}
