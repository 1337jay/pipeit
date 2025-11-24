/**
 * @pipeit/tx-builder
 *
 * Type-safe transaction builder for Solana with smart defaults.
 *
 * @packageDocumentation
 */

// Main export - unified builder
export { TransactionBuilder } from './builder/builder.js';
export type { 
  TransactionBuilderConfig, 
  SimulationResult,
  ExportFormat,
  ExportedTransaction,
} from './builder/builder.js';

// Re-export Kit types for convenience
export type { Base64EncodedWireTransaction } from '@solana/transactions';

// Type-safety types
export type { BuilderState, RequiredState, BuilderConfig, LifetimeConstraint } from './types.js';

// Errors
export * from './errors/index.js';

// Validation
export * from './validation/index.js';

// Utils
export * from './utils/index.js';

// Helpers
export * from './helpers.js';
