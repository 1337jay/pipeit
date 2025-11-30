/**
 * Core types for @pipeit/actions
 * 
 * Design principles:
 * - Protocol-agnostic interfaces
 * - Pluggable adapters
 * - Type-safe composition
 * 
 * @packageDocumentation
 */

import type { Address } from '@solana/addresses';
import type { Instruction } from '@solana/instructions';
import type {
  Rpc,
  GetLatestBlockhashApi,
  GetAccountInfoApi,
  GetEpochInfoApi,
  GetSignatureStatusesApi,
  SendTransactionApi,
} from '@solana/rpc';
import type {
  RpcSubscriptions,
  SignatureNotificationsApi,
  SlotNotificationsApi,
} from '@solana/rpc-subscriptions';
import type { TransactionSigner } from '@solana/signers';

/**
 * Minimum RPC API required for actions.
 * This is compatible with FlowContext from tx-builder.
 */
export type ActionsRpcApi = GetAccountInfoApi & GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi & GetLatestBlockhashApi;

/**
 * Minimum RPC subscriptions API required for actions.
 */
export type ActionsRpcSubscriptionsApi = SignatureNotificationsApi & SlotNotificationsApi;

// =============================================================================
// Core Action Types
// =============================================================================

/**
 * Context passed to all actions during execution.
 * Contains the RPC clients and signer needed to build instructions.
 */
export interface ActionContext {
  /** The transaction signer (wallet) */
  signer: TransactionSigner;
  /** RPC client for querying on-chain data */
  rpc: Rpc<ActionsRpcApi>;
  /** RPC subscriptions for confirmations */
  rpcSubscriptions: RpcSubscriptions<ActionsRpcSubscriptionsApi>;
}

/**
 * Result returned by an action.
 * Contains the instructions to execute and optional metadata.
 */
export interface ActionResult {
  /** Instructions to include in the transaction */
  instructions: Instruction[];
  /** Suggested compute units for this action (optional hint) */
  computeUnits?: number;
  /** Any additional data returned by the action */
  data?: Record<string, unknown>;
}

/**
 * An action executor - a function that takes context and returns instructions.
 */
export type ActionExecutor = (ctx: ActionContext) => Promise<ActionResult>;

/**
 * An action factory - creates an executor from parameters.
 * 
 * @example
 * ```ts
 * const swapAction: ActionFactory<SwapParams> = (params) => async (ctx) => {
 *   // Build instructions based on params and ctx
 *   return { instructions: [...] }
 * }
 * ```
 */
export type ActionFactory<TParams> = (params: TParams) => ActionExecutor;

// =============================================================================
// Swap Types (Protocol-Agnostic)
// =============================================================================

/**
 * Parameters for a token swap action.
 * Protocol-agnostic - works with any swap adapter.
 */
export interface SwapParams {
  /** Token mint to swap from */
  inputMint: Address | string;
  /** Token mint to swap to */
  outputMint: Address | string;
  /** Amount to swap (in smallest units, e.g., lamports for SOL) */
  amount: bigint | number;
  /** Slippage tolerance in basis points (default: 50 = 0.5%) */
  slippageBps?: number;
}

/**
 * Extended result for swap actions with quote information.
 */
export interface SwapResult extends ActionResult {
  data: {
    /** Input amount in smallest units */
    inputAmount: bigint;
    /** Expected output amount in smallest units */
    outputAmount: bigint;
    /** Price impact percentage (optional) */
    priceImpactPct?: number;
    /** Route information (adapter-specific) */
    route?: unknown;
  };
}

/**
 * Adapter interface for swap operations.
 * Implement this to create a custom swap adapter.
 * 
 * @example
 * ```ts
 * const mySwapAdapter: SwapAdapter = {
 *   swap: (params) => async (ctx) => {
 *     // Call your preferred DEX API
 *     return { instructions: [...], data: { inputAmount, outputAmount } }
 *   }
 * }
 * ```
 */
export interface SwapAdapter {
  /** Create a swap action from parameters */
  swap: ActionFactory<SwapParams>;
}

// =============================================================================
// Pipe Configuration
// =============================================================================

/**
 * Configuration for creating a pipe.
 */
export interface PipeConfig {
  /** RPC client for querying on-chain data */
  rpc: Rpc<ActionsRpcApi>;
  /** RPC subscriptions for confirmations */
  rpcSubscriptions: RpcSubscriptions<ActionsRpcSubscriptionsApi>;
  /** The transaction signer (wallet) */
  signer: TransactionSigner;
  /** Configured adapters for different action types */
  adapters?: {
    /** Swap adapter (e.g., Jupiter, Raydium API) */
    swap?: SwapAdapter;
  };
}

/**
 * Result from executing a pipe.
 */
export interface PipeResult {
  /** Transaction signature */
  signature: string;
  /** Results from each action in the pipe */
  actionResults: ActionResult[];
}
