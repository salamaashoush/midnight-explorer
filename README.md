# Midnight Explorer

A block & transaction explorer for the [Midnight](https://midnight.network)
**Preview** network. Browses blocks, transactions, and contracts straight
from the public indexer — and decodes contract state and raw transactions
with the official Midnight WASM libraries.

Midnight is a privacy chain: shielded transaction senders, receivers, and
amounts are private by design and are **not** shown. The explorer surfaces
only what is public — block metadata, transaction status and fees,
unshielded (NIGHT) token movements, contract actions, and public ledger
state.

## Features

- **Networks** — switch between **Preview**, **Preprod**, and a
  **Local** node (`localhost:8088`) from the header; the choice is
  cookie-backed so SSR and every query resolve against it.
- **Live block feed** — new blocks stream in over a `graphql-ws`
  WebSocket subscription to the indexer.
- **Blocks** — latest blocks, per-block transaction lists, prev/next
  navigation.
- **Transactions** — status, fees, unshielded NIGHT transfers (spent /
  created UTXOs), contract interactions, identifiers, and a structured
  **ledger decode** of the raw bytes via `@midnight-ntwrk/ledger-v8`.
- **Contracts** — latest action, unshielded balances, and decoded public
  ledger state via `@midnight-ntwrk/midnight-js-indexer-public-data-provider`.
- **Network** — current epoch progress, stake-pool count, D-parameter and
  terms-and-conditions governance history.
- **Search** — block height, block / transaction hash, transaction
  identifier, or contract address.

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React, SSR,
  file-based routing, server functions
- [TanStack Query](https://tanstack.com/query) — server-state + cache
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Midnight `midnight-js` providers and the `ledger-v8` WASM libraries

The Midnight WASM packages depend on Node-only modules, so they run inside
TanStack Start **server functions** rather than the browser bundle.

## Data source

The Midnight indexer GraphQL API. The active network is chosen in the
header (default Preview):

- Preview — `https://indexer.preview.midnight.network/api/v3/graphql`
- Preprod — `https://indexer.preprod.midnight.network/api/v3/graphql`
- Local — `http://localhost:8088/api/v3/graphql`

## Development

```bash
bun install
bun run dev      # http://localhost:3000
```

```bash
bun run build    # production build
bun run check    # biome lint + format
```
