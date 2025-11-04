# @pipeit/solana-transaction-builder

A comprehensive, Effect-inspired Solana transaction building library that makes it easier to build transactions on Solana by reducing boilerplate and providing type-safe, composable APIs.

## Packages

- `@pipeit/tx-errors` - Typed error definitions and error handling utilities
- `@pipeit/tx-core` - Core types, utilities, and base transaction builder
- `@pipeit/tx-builder` - High-level builder API (beginner-friendly layer)
- `@pipeit/tx-effect` - Effect-based API for advanced users
- `@pipeit/tx-templates` - Pre-built transaction templates for common operations
- `@pipeit/tx-middleware` - Composable middleware (retry, simulation, logging)

## Installation

```bash
pnpm install @pipeit/tx-builder
# or for Effect-based API
pnpm install @pipeit/tx-effect effect
```

## Quick Start

### Simple API

```typescript
import { createTransaction } from '@pipeit/tx-builder'

const result = await createTransaction()
  .transfer({ from: wallet, to: destination, amount: 1_000_000n })
  .withPriorityFee('high')
  .send(rpc)
```

### Effect API

```typescript
import { Transaction } from '@pipeit/tx-effect'
import { Effect } from 'effect'

const transferEffect = Transaction.transfer({
  destination: address('...'),
  amount: 1_000_000n
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout('30 seconds')
)

const result = await Effect.runPromise(
  transferEffect.pipe(
    Effect.provide(RpcService.layer(rpc)),
    Effect.provide(WalletService.layer(wallet))
  )
)
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run type checking
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT






