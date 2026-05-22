import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export type NetworkId = "preview" | "preprod" | "local";

export interface Network {
	id: NetworkId;
	label: string;
	indexerHttp: string;
	indexerWs: string;
}

export const NETWORKS: Record<NetworkId, Network> = {
	preview: {
		id: "preview",
		label: "Preview",
		indexerHttp: "https://indexer.preview.midnight.network/api/v3/graphql",
		indexerWs: "wss://indexer.preview.midnight.network/api/v3/graphql/ws",
	},
	preprod: {
		id: "preprod",
		label: "Preprod",
		indexerHttp: "https://indexer.preprod.midnight.network/api/v3/graphql",
		indexerWs: "wss://indexer.preprod.midnight.network/api/v3/graphql/ws",
	},
	local: {
		id: "local",
		label: "Local",
		indexerHttp: "http://localhost:8088/api/v3/graphql",
		indexerWs: "ws://localhost:8088/api/v3/graphql/ws",
	},
};

export const NETWORK_LIST: Network[] = Object.values(NETWORKS);
export const DEFAULT_NETWORK: NetworkId = "preview";
export const NETWORK_COOKIE = "mn-explorer-network";

export function isNetworkId(value: unknown): value is NetworkId {
	return value === "preview" || value === "preprod" || value === "local";
}

// Reads the selected-network cookie. `createIsomorphicFn` keeps the
// server impl (and its `getCookie` import) out of the browser bundle.
const readNetworkCookie = createIsomorphicFn()
	.server(() => getCookie(NETWORK_COOKIE))
	.client(
		() =>
			document.cookie
				.split("; ")
				.find((c) => c.startsWith(`${NETWORK_COOKIE}=`))
				?.split("=")[1],
	);

// The active network for the current request (SSR) or session (client).
export function activeNetwork(): Network {
	const id = readNetworkCookie();
	return NETWORKS[isNetworkId(id) ? id : DEFAULT_NETWORK];
}

// Persists the network choice. The caller reloads so SSR and every
// query re-resolve against the new network.
export function setNetwork(id: NetworkId): void {
	// biome-ignore lint/suspicious/noDocumentCookie: CookieStore API is not universally supported
	document.cookie = `${NETWORK_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}
