import { queryOptions } from "@tanstack/react-query";

// Midnight Preview testnet indexer. `/api/v3` is an alias of `/api/v4`.
// CORS is open (`access-control-allow-origin: *`), so the browser can
// query it directly — no server proxy needed.
export const INDEXER_HTTP =
	"https://indexer.preview.midnight.network/api/v3/graphql";
export const INDEXER_WS =
	"wss://indexer.preview.midnight.network/api/v3/graphql/ws";
export const NETWORK = "Preview";

type GqlResponse<T> = { data?: T; errors?: { message: string }[] };

async function gql<T>(
	query: string,
	variables?: Record<string, unknown>,
): Promise<T> {
	const res = await fetch(INDEXER_HTTP, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
	});
	if (!res.ok) throw new Error(`Indexer HTTP ${res.status}`);
	const json = (await res.json()) as GqlResponse<T>;
	if (json.errors?.length)
		throw new Error(json.errors.map((e) => e.message).join("; "));
	if (!json.data) throw new Error("Indexer returned no data");
	return json.data;
}

// --- Types -----------------------------------------------------------------

export type TxStatus = "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE";

export interface Block {
	hash: string;
	height: number;
	timestamp: number;
	author: string | null;
	protocolVersion: number;
	transactions: Tx[];
}

export interface UnshieldedUtxo {
	owner: string;
	tokenType: string;
	value: string;
	outputIndex?: number;
}

export interface TxContractAction {
	__typename: "ContractDeploy" | "ContractCall" | "ContractUpdate";
	address: string;
	entryPoint?: string;
}

export interface Tx {
	hash: string;
	protocolVersion: number;
	raw?: string;
	identifiers?: string[];
	merkleTreeRoot?: string;
	transactionResult?: { status: TxStatus };
	fees?: { paidFees: string };
	block?: { height: number; hash: string; timestamp: number };
	contractActions?: TxContractAction[];
	unshieldedCreatedOutputs?: UnshieldedUtxo[];
	unshieldedSpentOutputs?: UnshieldedUtxo[];
}

// The all-zero token type is the network's native token (NIGHT),
// which uses 6 decimal places.
export const NATIVE_TOKEN = "0".repeat(64);

export function formatAmount(value: string, tokenType: string): string {
	if (tokenType !== NATIVE_TOKEN) return value;
	try {
		const v = BigInt(value);
		const whole = v / 1_000_000n;
		const frac = (v % 1_000_000n)
			.toString()
			.padStart(6, "0")
			.replace(/0+$/, "");
		return `${whole.toLocaleString()}${frac ? `.${frac}` : ""} NIGHT`;
	} catch {
		return value;
	}
}

export interface ContractAction {
	__typename: "ContractDeploy" | "ContractCall" | "ContractUpdate";
	address: string;
	state: string;
	zswapState: string;
	entryPoint?: string;
	unshieldedBalances: { tokenType: string; amount: string }[];
	transaction: { hash: string; block?: { height: number; timestamp: number } };
}

// --- GraphQL fragments -------------------------------------------------------

const TX_IN_BLOCK = `
  hash
  ... on RegularTransaction {
    transactionResult { status }
    fees { paidFees }
  }`;

const BLOCK_LITE = `hash height timestamp author transactions { hash }`;

// --- Fetchers ----------------------------------------------------------------

// There is no `blocks` plural query, and the indexer caps query
// nesting at depth 15 (so walking `parent` only reaches ~12 blocks).
// Instead: one request for the tip height, then one aliased query
// (`b0: block(...) b1: block(...)`) — aliases are flat siblings, no
// nesting-depth cost.
export async function fetchLatestBlocks(count = 20): Promise<Block[]> {
	const tip = await gql<{ block: { height: number } | null }>(
		`{ block { height } }`,
	);
	const top = tip.block?.height;
	if (top === undefined) return [];

	const heights: number[] = [];
	for (let i = 0; i < count && top - i >= 0; i++) heights.push(top - i);

	const aliases = heights
		.map((h, i) => `b${i}: block(offset: { height: ${h} }) { ${BLOCK_LITE} }`)
		.join("\n");
	const data = await gql<Record<string, Block | null>>(`{ ${aliases} }`);

	return heights
		.map((_, i) => data[`b${i}`])
		.filter((b): b is Block => b != null);
}

export async function fetchBlock(id: string): Promise<Block | null> {
	const offset = /^\d+$/.test(id)
		? { height: Number(id) }
		: { hash: id.replace(/^0x/, "") };
	const data = await gql<{ block: Block | null }>(
		`query ($o: BlockOffset!) {
      block(offset: $o) {
        hash height timestamp author protocolVersion
        transactions { ${TX_IN_BLOCK} }
      }
    }`,
		{ o: offset },
	);
	return data.block;
}

const TX_FIELDS = `
  hash protocolVersion
  ... on RegularTransaction {
    raw identifiers merkleTreeRoot
    transactionResult { status }
    fees { paidFees }
    block { height hash timestamp }
    contractActions {
      __typename
      address
      ... on ContractCall { entryPoint }
    }
    unshieldedCreatedOutputs { owner tokenType value outputIndex }
    unshieldedSpentOutputs { owner tokenType value }
  }`;

// A transaction is reachable either by its 32-byte hash or by any of
// its 33-byte identifiers. Hash lookup throws on a non-32-byte input,
// so each offset kind is tried independently.
export async function fetchTransaction(idOrHash: string): Promise<Tx | null> {
	const v = idOrHash.replace(/^0x/, "");
	for (const kind of ["hash", "identifier"] as const) {
		try {
			const data = await gql<{ transactions: Tx[] }>(
				`query ($v: HexEncoded!) {
          transactions(offset: { ${kind}: $v }) { ${TX_FIELDS} }
        }`,
				{ v },
			);
			if (data.transactions[0]) return data.transactions[0];
		} catch {
			// input is not valid for this offset kind — try the next
		}
	}
	return null;
}

export async function fetchContract(
	address: string,
): Promise<ContractAction | null> {
	const data = await gql<{ contractAction: ContractAction | null }>(
		`query ($a: HexEncoded!) {
      contractAction(address: $a) {
        __typename
        address state zswapState
        ... on ContractCall { entryPoint }
        unshieldedBalances { tokenType amount }
        transaction { hash block { height timestamp } }
      }
    }`,
		{ a: address.replace(/^0x/, "") },
	);
	return data.contractAction;
}

// --- TanStack Query option factories ----------------------------------------

export const latestBlocksQuery = (depth = 15) =>
	queryOptions({
		queryKey: ["latest-blocks", depth],
		queryFn: () => fetchLatestBlocks(depth),
		refetchInterval: 6_000,
	});

export const blockQuery = (id: string) =>
	queryOptions({
		queryKey: ["block", id],
		queryFn: () => fetchBlock(id),
	});

export const txQuery = (hash: string) =>
	queryOptions({
		queryKey: ["tx", hash],
		queryFn: () => fetchTransaction(hash),
	});

export const contractQuery = (address: string) =>
	queryOptions({
		queryKey: ["contract", address],
		queryFn: () => fetchContract(address),
	});

// --- Network / governance ----------------------------------------------------

export interface DParameterChange {
	blockHeight: number;
	timestamp: number;
	numPermissionedCandidates: number;
	numRegisteredCandidates: number;
}

export interface TermsChange {
	blockHeight: number;
	timestamp: number;
	hash: string;
	url: string;
}

export interface NetworkInfo {
	currentEpochInfo: {
		epochNo: number;
		durationSeconds: number;
		elapsedSeconds: number;
	};
	spoCount: number;
	dParameterHistory: DParameterChange[];
	termsAndConditionsHistory: TermsChange[];
}

export async function fetchNetwork(): Promise<NetworkInfo> {
	return gql<NetworkInfo>(
		`{
      currentEpochInfo { epochNo durationSeconds elapsedSeconds }
      spoCount
      dParameterHistory {
        blockHeight timestamp
        numPermissionedCandidates numRegisteredCandidates
      }
      termsAndConditionsHistory { blockHeight timestamp hash url }
    }`,
	);
}

export const networkQuery = () =>
	queryOptions({
		queryKey: ["network"],
		queryFn: fetchNetwork,
		refetchInterval: 30_000,
	});
