import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "graphql-ws";
import { useEffect, useState } from "react";
import { type Block, INDEXER_WS, latestBlocksQuery } from "./indexer";

const BLOCKS_SUBSCRIPTION = `
  subscription {
    blocks {
      hash
      height
      timestamp
      author
      transactions { hash }
    }
  }`;

// Streams new blocks from the indexer over a graphql-ws WebSocket and
// prepends them into the `latest-blocks` query cache, so TanStack
// Query stays the single source of truth. Client-only — the effect
// never runs during SSR. Returns the live-connection state.
export function useLiveBlocks(count = 20): boolean {
	const queryClient = useQueryClient();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		const client = createClient({ url: INDEXER_WS });
		const key = latestBlocksQuery(count).queryKey;

		const unsubscribe = client.subscribe<{ blocks: Block }>(
			{ query: BLOCKS_SUBSCRIPTION },
			{
				next: ({ data }) => {
					setConnected(true);
					const block = data?.blocks;
					if (!block) return;
					queryClient.setQueryData<Block[]>(key, (old) => {
						const list = old ?? [];
						if (list.some((b) => b.hash === block.hash)) return list;
						return [block, ...list].slice(0, count);
					});
				},
				error: () => setConnected(false),
				complete: () => setConnected(false),
			},
		);

		return () => {
			unsubscribe();
			void client.dispose();
		};
	}, [queryClient, count]);

	return connected;
}
