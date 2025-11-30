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

// Flow API - for multi-step transaction orchestration with dynamic context
export { createFlow, TransactionFlow } from './flow/index.js';
export type {
  FlowConfig,
  FlowContext,
  FlowHooks,
  FlowStep,
  FlowStepResult,
  StepCreator,
  ExecutionStrategy,
} from './flow/index.js';

// Plans API - Kit instruction-plans re-exports and helpers
export * from './plans/index.js';

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

// Signers - re-exports from Kit
export * from './signers/index.js';

// Packing - message packing utilities
export * from './packing/index.js';
