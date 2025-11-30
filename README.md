# 🚰 Pipeit - Type-Safe Solana Transaction Builder

A comprehensive Solana transaction building library that reduces boilerplate and provides type-safe, composable APIs built on @solana/kit.

## Packages

- **@pipeit/tx-builder** - Main transaction builder with smart defaults, multi-step flows, and Kit instruction-plans integration
- **@pipeit/tx-idl** - IDL-based transaction building with automatic account discovery

## Installation

```bash
# Main builder package (recommended for most users)
pnpm install @pipeit/tx-builder @solana/kit

# IDL-based building
pnpm install @pipeit/tx-idl @solana/kit
```

## Quick Start

### Single Transaction

```typescript
import { TransactionBuilder } from '@pipeit/tx-builder';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

// Auto-retry, auto-blockhash fetch, built-in validation
const signature = await new TransactionBuilder({ rpc, autoRetry: true, logLevel: 'verbose' })
  .setFeePayer(signer.address)
  .addInstruction(yourInstruction)
  .execute({ rpcSubscriptions });
```

### Multi-Step Flows

For workflows where instructions depend on previous results:

```typescript
import { createFlow } from '@pipeit/tx-builder';

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
import { sequentialInstructionPlan, executePlan } from '@pipeit/tx-builder';

// Kit's instruction-plans are re-exported for advanced use cases
const plan = sequentialInstructionPlan([ix1, ix2, ix3, ix4, ix5]);
const result = await executePlan(plan, { rpc, rpcSubscriptions, signer });
```

### Simulation

```typescript
const result = await new TransactionBuilder({ rpc })
  .setFeePayer(signer.address)
  .addInstruction(instruction)
  .simulate();

if (result.err) {
  console.error('Simulation failed:', result.logs);
} else {
  console.log('Success! Units consumed:', result.unitsConsumed);
}
```

### IDL-Based Transactions

```typescript
import { IdlProgramRegistry } from '@pipeit/tx-idl';
import { TransactionBuilder } from '@pipeit/tx-builder';

const registry = new IdlProgramRegistry();
await registry.registerProgram(programId, rpc);

// Automatic account discovery!
const instruction = await registry.buildInstruction(
  programId,
  'swap',
  { 
    amountIn: 1000000n, 
    inputMint: SOL_MINT,    // Auto-derives userSourceTokenAccount
    outputMint: USDC_MINT   // Auto-derives userDestTokenAccount
  },
  {}, // Accounts auto-discovered!
  { signer: userAddress, programId, rpc }
);

const signature = await new TransactionBuilder({ rpc })
  .setFeePayer(signer.address)
  .addInstruction(instruction)
  .execute({ rpcSubscriptions });
```

## Features

### @pipeit/tx-builder

**Single Transactions:**
- **Type-Safe Builder**: Compile-time checks ensure all required fields are set
- **Auto-Blockhash**: Automatically fetches latest blockhash when RPC provided
- **Smart Defaults**: Opinionated configuration for common use cases
- **Auto-Retry**: Configurable retry with exponential backoff
- **Built-in Validation**: Automatic transaction size and field validation
- **Simulation**: Test transactions before sending
- **Comprehensive Logging**: Verbose error logs with simulation details

**Multi-Step Flows:**
- **Dynamic Context**: Build instructions that depend on previous step results
- **Automatic Batching**: Intelligently batch instructions into single transactions
- **Atomic Groups**: Group instructions that must execute together
- **Size Handling**: Auto-split transactions that exceed size limits
- **Execution Hooks**: Monitor step lifecycle with onStepStart, onStepComplete, onStepError

**Kit Integration:**
- **Instruction Plans**: Re-exports `@solana/instruction-plans` for advanced planning
- **executePlan()**: Execute Kit instruction plans with TransactionBuilder features

### @pipeit/tx-idl

- **Automatic IDL Fetching**: Fetch program IDLs from on-chain or registries
- **Account Auto-Discovery**: Automatically resolve accounts, PDAs, and ATAs
- **Protocol Plugins**: Extensible system for Jupiter, Kamino, Raydium, etc.
- **Full Type Support**: Handles all Anchor/Codama type definitions
- **JSON Schema Generation**: Auto-generate parameter schemas for UIs

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
