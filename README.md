# 🚰 Pipeit - Type-Safe Solana Transaction Builder

A comprehensive Solana transaction building library that reduces boilerplate and provides type-safe, composable APIs built on @solana/kit.

## Packages

- **@pipeit/core** - Main transaction builder with smart defaults, multi-step flows, execution strategies, and Kit instruction-plans integration
- **@pipeit/actions** - High-level DeFi actions with pluggable protocol adapters (Jupiter, Raydium, etc.)
- **@pipeit/fastlane** - Native Rust QUIC client for direct Solana TPU transaction submission (ultra-fast, requires server-side setup)

## Installation

```bash
# Main builder package (recommended for most users)
pnpm install @pipeit/core @solana/kit

# High-level DeFi actions
pnpm install @pipeit/actions @pipeit/core @solana/kit

# TPU direct submission (ultra-fast, requires server-side setup)
pnpm install @pipeit/fastlane
```

## Quick Start

### Single Transaction

```typescript
import { TransactionBuilder } from '@pipeit/core';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

// Auto-retry, auto-blockhash fetch, built-in validation
const signature = await new TransactionBuilder({
    rpc,
    autoRetry: true,
    priorityFee: 'high',
    logLevel: 'verbose',
})
    .setFeePayerSigner(signer)
    .addInstruction(yourInstruction)
    .execute({ rpcSubscriptions });
```

### Multi-Step Flows

For workflows where instructions depend on previous results:

```typescript
import { createFlow } from '@pipeit/core';

const result = await createFlow({ rpc, rpcSubscriptions, signer })
  .step('create-account', (ctx) => createAccountInstruction(...))
  .step('init-metadata', (ctx) => {
    // Access previous step results
    const prevResult = ctx.get('create-account');
    return initMetadataInstruction(prevResult, ...);
  })
  .atomic('swap', [
    (ctx) => wrapSolInstruction(...),
    (ctx) => swapInstruction(...),
  ])
  .onStepComplete((name, result) => console.log(`${name}: ${result.signature}`))
  .execute();
```

### Static Instruction Plans (Kit Integration)

For advanced users who know all instructions upfront:

```typescript
import { sequentialInstructionPlan, executePlan } from '@pipeit/core';

// Kit's instruction-plans are re-exported for advanced use cases
const plan = sequentialInstructionPlan([ix1, ix2, ix3, ix4, ix5]);
const result = await executePlan(plan, { rpc, rpcSubscriptions, signer });
```

### Simulation

```typescript
const result = await new TransactionBuilder({ rpc }).setFeePayerSigner(signer).addInstruction(instruction).simulate();

if (result.err) {
    console.error('Simulation failed:', result.logs);
} else {
    console.log('Success! Units consumed:', result.unitsConsumed);
}
```

### High-Level DeFi Actions

```typescript
import { pipe } from '@pipeit/actions';
import { jupiter } from '@pipeit/actions/adapters';

// Simple, composable DeFi actions
const result = await pipe({
    rpc,
    rpcSubscriptions,
    signer,
    adapters: { swap: jupiter() },
})
    .swap({
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        amount: 100_000_000n, // 0.1 SOL
        slippageBps: 50, // 0.5%
    })
    .execute();

console.log('Swap completed:', result.signature);

// Simulate before executing
const simulation = await pipe({ rpc, rpcSubscriptions, signer, adapters: { swap: jupiter() } })
    .swap({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 100_000_000n,
    })
    .simulate();

if (simulation.success) {
    console.log('Estimated compute units:', simulation.unitsConsumed);
}
```

## Execution Strategies

Pipeit supports multiple execution strategies for submitting transactions, from standard RPC to ultra-fast direct TPU submission.

### Presets

| Preset | Description | Use Case |
|--------|-------------|----------|
| `'standard'` | Default RPC submission only | Standard transactions, no special requirements |
| `'economical'` | Jito bundle only (MEV protection) | DeFi swaps, MEV-sensitive transactions |
| `'fast'` | Jito + parallel RPC race | Maximum landing probability, time-sensitive |
| `'ultra'` | TPU direct + Jito race | Fastest possible (requires `@pipeit/fastlane`) |

### Using Presets

```typescript
// Standard RPC submission (default)
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ rpcSubscriptions });

// Jito bundle for MEV protection
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: 'economical', // Jito bundle with default tip
    });

// Jito + parallel RPC race for maximum speed
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: 'fast', // Races Jito vs parallel RPCs
    });

// Ultra-fast TPU direct submission (requires @pipeit/fastlane)
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: 'ultra', // Races TPU direct vs Jito
    });
```

### Custom Configuration

For fine-grained control over execution strategies:

```typescript
// Custom Jito configuration
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: {
            jito: {
                enabled: true,
                tipLamports: 50_000n, // Custom tip amount
                blockEngineUrl: 'ny', // Regional endpoint
                mevProtection: true, // Enable MEV protection
            },
        },
    });

// Parallel RPC submission
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: {
            parallel: {
                enabled: true,
                endpoints: [
                    'https://api.mainnet-beta.solana.com',
                    'https://solana-api.projectserum.com',
                ],
                raceWithDefault: true, // Include builder's RPC in race
            },
        },
    });

// TPU direct submission (server-side only)
const signature = await new TransactionBuilder({ rpc })
    .setFeePayerSigner(signer)
    .addInstruction(instruction)
    .execute({ 
        rpcSubscriptions,
        execution: {
            tpu: {
                enabled: true,
                rpcUrl: 'https://api.mainnet-beta.solana.com',
                wsUrl: 'wss://api.mainnet-beta.solana.com',
                fanout: 2, // Number of leaders to send to
            },
        },
    });
```

## Server Setup (TPU Direct Submission)

For browser environments, TPU direct submission requires a server-side API route. Pipeit provides a drop-in handler for Next.js:

### Next.js API Route

Create `app/api/tpu/route.ts`:

```typescript
export { tpuHandler as POST } from '@pipeit/core/server';
```

Or with custom configuration:

```typescript
import { tpuHandler } from '@pipeit/core/server';

export async function POST(request: Request) {
    return tpuHandler(request, {
        rpcUrl: process.env.SOLANA_RPC_URL,
        wsUrl: process.env.SOLANA_WS_URL,
        fanout: 2,
    });
}
```

The handler automatically uses `@pipeit/fastlane` when available, falling back to an error if not installed. In browser environments, transactions are sent to this API route which forwards them via the native QUIC client.

### Environment Variables

Set these in your `.env.local`:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
```

## Features

### @pipeit/core

**Single Transactions:**

- **Type-Safe Builder**: Compile-time checks ensure all required fields are set
- **Auto-Blockhash**: Automatically fetches latest blockhash when RPC provided
- **Smart Defaults**: Opinionated configuration for common use cases
- **Priority Fees**: Configurable priority fee levels (none, low, medium, high, veryHigh) or custom percentile-based estimation
- **Compute Budget**: Automatic or custom compute unit limits
- **Address Lookup Tables**: Automatic compression for versioned transactions
- **Durable Nonce**: Built-in support for nonce-based transactions
- **Auto-Retry**: Configurable retry with exponential backoff
- **Built-in Validation**: Automatic transaction size and field validation
- **Simulation**: Test transactions before sending
- **Export Formats**: Export transactions as base64, base58, or raw bytes
- **Comprehensive Logging**: Verbose error logs with simulation details

**Execution Strategies:**

- **Jito Bundle Submission**: MEV-protected transaction bundles via Jito block engine
- **Parallel RPC Submission**: Race transactions across multiple RPC endpoints for higher landing probability
- **Direct TPU Submission**: Ultra-fast QUIC-based submission directly to validator TPU endpoints (requires `@pipeit/fastlane`)
- **Execution Presets**: Simple presets (`standard`, `economical`, `fast`, `ultra`) or fine-grained custom configuration
- **Smart Racing**: Automatically races multiple submission paths, using the first successful result

**Multi-Step Flows:**

- **Dynamic Context**: Build instructions that depend on previous step results
- **Automatic Batching**: Intelligently batch instructions into single transactions
- **Atomic Groups**: Group instructions that must execute together
- **Size Handling**: Auto-split transactions that exceed size limits
- **Execution Hooks**: Monitor step lifecycle with onStepStart, onStepComplete, onStepError

**Kit Integration:**

- **Instruction Plans**: Re-exports `@solana/instruction-plans` for advanced planning
- **executePlan()**: Execute Kit instruction plans with TransactionBuilder features

**Server Exports:**

- **TPU Handler**: Drop-in Next.js API route handler for browser TPU submission

### @pipeit/actions

- **High-Level DeFi Actions**: Simple, composable API for swaps, lending, staking
- **Pluggable Adapters**: Protocol-specific adapters (Jupiter, Raydium, etc.)
- **API-Centric Design**: Delegates complexity to protocol APIs for reliability
- **Fluent Builder**: Chain multiple actions with `.swap()`, `.add()`, etc.
- **Simulation Support**: Test action sequences before execution
- **Lifecycle Hooks**: Monitor action progress with `onActionStart`, `onActionComplete`, `onActionError`
- **Abort Signal**: Cancel execution with AbortController
- **Address Lookup Tables**: Automatic ALT handling for compressed transactions

### @pipeit/fastlane

- **Native QUIC Client**: Rust-based QUIC implementation via NAPI for maximum performance
- **Direct TPU Submission**: Bypass RPC nodes, send transactions directly to validator TPU endpoints
- **Leader Schedule Tracking**: Automatically tracks current and upcoming slot leaders
- **Connection Pre-warming**: Pre-establishes QUIC connections to upcoming leaders for lower latency
- **Cross-Platform**: Supports macOS (ARM64), Linux (x64), and Windows (x64)
- **Browser Support**: Server-side API route handler enables browser usage via Next.js

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## License

MIT
