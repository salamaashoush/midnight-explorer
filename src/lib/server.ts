import { createServerFn } from "@tanstack/react-start";
import { activeNetwork } from "./networks";

export interface DecodedContractState {
	/** Circuit entry points exposed by the contract. */
	operations: string[];
	/** Runtime pretty-printed view of the public ledger state. */
	stateRepr: string | null;
}

// `@midnight-ntwrk/midnight-js-indexer-public-data-provider` depends on
// the Node `ws` package, so it cannot run in the browser bundle. This
// server function runs the provider on the server and returns a
// structured, RPC-serializable view of the decoded contract state.
export const getContractState = createServerFn({ method: "GET" })
	.inputValidator((address: string) => address)
	.handler(async ({ data: address }): Promise<DecodedContractState | null> => {
		const { indexerPublicDataProvider } = await import(
			"@midnight-ntwrk/midnight-js-indexer-public-data-provider"
		);
		const net = activeNetwork();
		const provider = indexerPublicDataProvider(net.indexerHttp, net.indexerWs);
		const state = await provider.queryContractState(address);
		if (!state) return null;

		let operations: string[] = [];
		try {
			const ops = (state as { operations?: () => unknown }).operations?.();
			if (Array.isArray(ops)) operations = ops.map(String);
		} catch {
			/* operations() unavailable on this runtime version */
		}

		let stateRepr: string | null = null;
		try {
			const repr = (state as { toString?: () => string }).toString?.();
			if (repr && repr !== "[object Object]") {
				stateRepr =
					repr.length > 8000 ? `${repr.slice(0, 8000)}\n… (truncated)` : repr;
			}
		} catch {
			/* toString unavailable */
		}

		return { operations, stateRepr };
	});

export interface DecodedTx {
	identifiers: string[];
	intentCount: number;
	hasGuaranteedOffer: boolean;
	hasFallibleOffer: boolean;
	repr: string;
}

// Deserializes the tagged `raw` transaction bytes with the WASM ledger
// (`@midnight-ntwrk/ledger-v8`) into a structured, human-readable view.
// On-chain transactions are signed + proven + bound. POST — the raw
// hex payload is far too large for a GET query string.
export const decodeTransaction = createServerFn({ method: "POST" })
	.inputValidator((rawHex: string) => rawHex)
	.handler(async ({ data: rawHex }): Promise<DecodedTx | null> => {
		const ledger = await import("@midnight-ntwrk/ledger-v8");
		const bytes = Uint8Array.from(Buffer.from(rawHex, "hex"));
		let tx: ReturnType<typeof ledger.Transaction.deserialize>;
		try {
			tx = ledger.Transaction.deserialize(
				"signature",
				"proof",
				"binding",
				bytes,
			);
		} catch {
			return null;
		}
		const repr = tx.toString(true);
		return {
			identifiers: tx.identifiers().map(String),
			intentCount: tx.intents?.size ?? 0,
			hasGuaranteedOffer: tx.guaranteedOffer != null,
			hasFallibleOffer: tx.fallibleOffer != null,
			repr:
				repr.length > 12_000 ? `${repr.slice(0, 12_000)}\n… (truncated)` : repr,
		};
	});
