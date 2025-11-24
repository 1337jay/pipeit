# @pipeit/tx-builder

Type-safe transaction builder for Solana with smart defaults.

## Installation

```bash
pnpm install @pipeit/tx-builder @solana/kit
```

## Features

- Type-safe builder with compile-time validation
- Auto-blockhash fetching
- Built-in transaction validation
- Simulation support
- Export in multiple formats (base64, base58, bytes)
- Compute budget (priority fees & compute limits)
- Auto-retry with exponential backoff
- Comprehensive error handling

## Quick Start

```typescript
import { TransactionBuilder } from '@pipeit/tx-builder';
import { createSolanaRpc, createSolanaRpcSubscriptions, address } from '@solana/kit';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubs = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

// Build and execute
const signature = await new TransactionBuilder({ 
  rpc,
  autoRetry: true,
  priorityLevel: 'high' 
})
  .setFeePayer(address('...'))
  .addInstruction(instruction)
  .execute({ rpcSubscriptions: rpcSubs });
```

## Usage

### Build Message Only

```typescript
const message = await new TransactionBuilder({ rpc })
  .setFeePayer(address('...'))
  .addInstruction(instruction)
  .build(); // Blockhash automatically fetched!
```

### Simulate Before Sending

```typescript
const result = await new TransactionBuilder({ rpc })
  .setFeePayer(address('...'))
  .addInstruction(instruction)
  .simulate();

if (result.err) {
  console.error('Simulation failed:', result.logs);
} else {
  console.log('Compute units:', result.unitsConsumed);
}
```

### Execute with Auto-Retry

```typescript
const signature = await new TransactionBuilder({ 
  rpc,
  autoRetry: { maxAttempts: 5, backoff: 'exponential' }
})
  .setFeePayer(address('...'))
  .addInstruction(instruction)
  .execute({ rpcSubscriptions });
```

## Exporting Transactions

Sign and serialize transactions without sending. Useful for:
- Custom transport or different RPC
- Batch sending
- Hardware wallets
- QR codes for mobile wallets
- Cross-platform transaction passing

```typescript
// Export for custom RPC (base64 is default)
const { data: base64Tx } = await new TransactionBuilder({ rpc })
  .setFeePayer(address('...'))
  .addInstruction(instruction)
  .export('base64');

await customRpc.sendTransaction(base64Tx, { encoding: 'base64' });

// Export for QR code (human-readable)
const { data: base58Tx } = await builder.export('base58');
displayQRCode(base58Tx);

// Export raw bytes (hardware wallets)
const { data: bytes } = await builder.export('bytes');
await ledger.signTransaction(bytes);
```

### Export vs Other Methods

| Method | Signs | Sends | Returns |
|--------|-------|-------|---------|
| `.build()` | No | No | `TransactionMessage` |
| `.simulate()` | Yes* | No | `SimulationResult` |
| `.export()` | Yes | No | `ExportedTransaction` |
| `.execute()` | Yes | Yes | `string` (signature) |

*Signs for simulation only

## Compute Budget & Priority Fees

Control transaction execution cost and priority:

```typescript
const builder = new TransactionBuilder({ 
  rpc,
  // Priority fee for faster execution
  priorityLevel: 'high',      // Pays 50,000 micro-lamports per CU
  
  // Compute unit limit to prevent failures
  computeUnitLimit: 300_000   // Allow up to 300k compute units
});

// These automatically prepend ComputeBudget instructions
```

### Priority Levels

| Level | Micro-lamports per CU |
|-------|----------------------|
| `none` | 0 |
| `low` | 1,000 |
| `medium` | 10,000 (default) |
| `high` | 50,000 |
| `veryHigh` | 100,000 |

### Optimizing Compute Budget

```typescript
// 1. Simulate to see actual compute usage
const result = await builder.simulate();
console.log('Actual units:', result.unitsConsumed);

// 2. Create new builder with exact limit + buffer
const optimized = new TransactionBuilder({ 
  rpc,
  computeUnitLimit: Number(result.unitsConsumed) + 10_000,
  priorityLevel: 'medium'
});
```

## Configuration

```typescript
interface TransactionBuilderConfig {
  // Transaction version (default: 0)
  version?: 0 | 'legacy';
  
  // RPC for auto-blockhash fetch
  rpc?: Rpc<GetLatestBlockhashApi>;
  
  // Auto-retry configuration
  autoRetry?: boolean | { 
    maxAttempts: number; 
    backoff: 'linear' | 'exponential' 
  };
  
  // Priority fees
  priorityLevel?: 'none' | 'low' | 'medium' | 'high' | 'veryHigh';
  
  // Compute budget
  computeUnitLimit?: 'auto' | number;
  
  // Logging level
  logLevel?: 'silent' | 'minimal' | 'verbose';
}
```

## Error Handling

```typescript
import { 
  isBlockhashExpiredError,
  isSimulationFailedError,
  InsufficientFundsError
} from '@pipeit/tx-builder';

try {
  const sig = await builder.execute({ rpcSubscriptions });
} catch (error) {
  if (isBlockhashExpiredError(error)) {
    console.error('Blockhash expired, retry with fresh blockhash');
  } else if (isSimulationFailedError(error)) {
    console.error('Simulation failed');
  } else if (error instanceof InsufficientFundsError) {
    console.error(`Need ${error.required} lamports, have ${error.available}`);
  }
}
```

## Validation

Transactions are automatically validated before building/sending:

```typescript
import { validateTransaction, validateTransactionSize } from '@pipeit/tx-builder';

// Validation happens automatically in .build() and .execute()
// But you can also validate manually:
validateTransaction(message);
validateTransactionSize(message);
```

## API Reference

### Main Exports

- `TransactionBuilder` - Type-safe builder class
- `TransactionBuilderConfig` - Configuration interface
- `SimulationResult` - Simulation result interface
- `ExportFormat` - Export format type ('base64' | 'base58' | 'bytes')
- `ExportedTransaction` - Export result type

### Error Exports

- All error classes and predicates
- `isBlockhashExpiredError(error)` - Check for expired blockhash
- `isSimulationFailedError(error)` - Check for simulation failure

### Validation Exports

- `validateTransaction(message)`
- `validateTransactionSize(message)`
- `estimateTransactionSize(message)`
- `MAX_TRANSACTION_SIZE`

### Utility Exports

- `isValidAddress(value)`
- `assertIsAddress(value)`
- `formatLamports(lamports, decimals?)`
- `parseLamports(sol, decimals?)`

## License

MIT
