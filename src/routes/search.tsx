import { createFileRoute, redirect } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { EmptyState } from "#/components/bits";
import { Card, CardContent } from "#/components/ui/card";
import { fetchBlock, fetchContract, fetchTransaction } from "#/lib/indexer";

// Probes the indexer for a free-text query and redirects to the
// matching entity. Order: transaction → block → contract.
export const Route = createFileRoute("/search")({
	validateSearch: (search: Record<string, unknown>) => ({
		q: typeof search.q === "string" ? search.q : "",
	}),
	loaderDeps: ({ search }) => ({ q: search.q }),
	loader: async ({ deps }) => {
		const q = deps.q.trim();
		if (!q) return { q };

		if (/^\d+$/.test(q)) {
			const block = await fetchBlock(q);
			if (block) throw redirect({ to: "/block/$id", params: { id: q } });
			return { q };
		}

		const [tx, block, contract] = await Promise.allSettled([
			fetchTransaction(q),
			fetchBlock(q),
			fetchContract(q),
		]);
		if (tx.status === "fulfilled" && tx.value)
			throw redirect({ to: "/tx/$hash", params: { hash: q } });
		if (block.status === "fulfilled" && block.value)
			throw redirect({ to: "/block/$id", params: { id: q } });
		if (contract.status === "fulfilled" && contract.value)
			throw redirect({ to: "/contract/$address", params: { address: q } });

		return { q };
	},
	component: SearchPage,
});

function SearchPage() {
	const { q } = Route.useLoaderData();
	return (
		<Card>
			<CardContent>
				<EmptyState icon={SearchX} title="No match found">
					{q
						? `No transaction, block, or contract matched "${q}".`
						: "Enter a block height, block / transaction hash, or contract address."}
				</EmptyState>
			</CardContent>
		</Card>
	);
}
