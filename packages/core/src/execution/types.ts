/**
 * Types for execution strategies.
 *
 * @packageDocumentation
 */

import type { Address } from '@solana/addresses';
import type { Rpc, SendTransactionApi } from '@solana/rpc';
import type { RpcSubscriptions, SignatureNotificationsApi, SlotNotificationsApi } from '@solana/rpc-subscriptions';

/**
 * Jito block engine regional endpoints.
 */
export type JitoBlockEngineRegion = 'mainnet' | 'ny' | 'amsterdam' | 'frankfurt' | 'tokyo' | 'singapore' | 'slc';

/**
 * Configuration for Jito bundle submission.
 */
export interface JitoConfig {
  /**
   * Whether Jito bundle submission is enabled.
   */
  enabled: boolean;

  /**
   * Tip amount in lamports to include in the bundle.
   * Higher tips increase priority in the Jito auction.
   * @default 10_000n (0.00001 SOL)
   */
  tipLamports?: bigint;

  /**
   * Jito block engine URL.
   * Can be a full URL or a region key.
   * @default 'mainnet' (load-balanced)
   */
  blockEngineUrl?: string | JitoBlockEngineRegion;

  /**
   * Whether to use MEV protection (delays submission to risky leaders).
   * @default true
   */
  mevProtection?: boolean;
}

/**
 * Configuration for parallel RPC submission.
 */
export interface ParallelConfig {
  /**
   * Whether parallel submission is enabled.
   */
  enabled: boolean;

  /**
   * Additional RPC endpoint URLs to submit to in parallel.
   * These are used alongside the builder's configured RPC.
   */
  endpoints?: string[];

  /**
   * Whether to include the builder's default RPC in the parallel race.
   * @default true
   */
  raceWithDefault?: boolean;
}

/**
 * Execution strategy presets.
 * - 'standard': Default RPC submission only (no Jito, no parallel)
 * - 'economical': Jito bundle only (good balance of speed and cost)
 * - 'fast': Jito + parallel RPC race (maximum landing probability)
 */
export type ExecutionPreset = 'standard' | 'economical' | 'fast';

/**
 * Full execution configuration.
 * Can be a preset string or detailed configuration object.
 */
export type ExecutionConfig =
  | ExecutionPreset
  | {
      jito?: JitoConfig;
      parallel?: ParallelConfig;
    };

/**
 * Resolved execution configuration with all values filled in.
 */
export interface ResolvedExecutionConfig {
  jito: {
    enabled: boolean;
    tipLamports: bigint;
    blockEngineUrl: string;
    mevProtection: boolean;
  };
  parallel: {
    enabled: boolean;
    endpoints: string[];
    raceWithDefault: boolean;
  };
}

/**
 * Context required for execution strategies.
 */
export interface ExecutionContext {
  /**
   * RPC client for standard transaction submission.
   */
  rpc?: Rpc<SendTransactionApi>;

  /**
   * RPC subscriptions for confirmation.
   */
  rpcSubscriptions?: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>;

  /**
   * Fee payer address (needed for tip instruction).
   */
  feePayer?: Address;

  /**
   * Abort signal for cancellation.
   */
  abortSignal?: AbortSignal;
}

/**
 * Result from execution strategy.
 */
export interface ExecutionResult {
  /**
   * Transaction signature.
   */
  signature: string;

  /**
   * Which execution path landed the transaction.
   */
  landedVia: 'jito' | 'rpc' | 'parallel';

  /**
   * Time from submission to confirmation in milliseconds.
   */
  latencyMs?: number;

  /**
   * Bundle ID if submitted via Jito.
   */
  bundleId?: string;

  /**
   * Which endpoint landed the transaction (for parallel).
   */
  endpoint?: string;
}

// ============================================================================
// Jito API Types
// ============================================================================

/**
 * Jito sendBundle JSON-RPC response.
 */
export interface JitoBundleResponse {
  jsonrpc: '2.0';
  id: number;
  result?: string; // bundle_id (SHA-256 hash of signatures)
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Jito getBundleStatuses response.
 */
export interface JitoBundleStatusResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    context: {
      slot: number;
    };
    value: Array<{
      bundle_id: string;
      transactions: string[];
      slot: number;
      confirmation_status: 'processed' | 'confirmed' | 'finalized';
      err: { Ok: null } | { Err: unknown };
    } | null>;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Jito getTipAccounts response.
 */
export interface JitoTipAccountsResponse {
  jsonrpc: '2.0';
  id: number;
  result?: string[];
  error?: {
    code: number;
    message: string;
  };
}

// ============================================================================
// Parallel Submission Types
// ============================================================================

/**
 * Options for parallel submission.
 */
export interface ParallelSubmitOptions {
  /**
   * RPC endpoint URLs to submit to.
   */
  endpoints: string[];

  /**
   * Base64-encoded signed transaction.
   */
  transaction: string;

  /**
   * Whether to skip preflight simulation.
   * @default true
   */
  skipPreflight?: boolean;

  /**
   * Abort signal for cancellation.
   */
  abortSignal?: AbortSignal;
}

/**
 * Result from parallel submission.
 */
export interface ParallelSubmitResult {
  /**
   * Transaction signature.
   */
  signature: string;

  /**
   * Which endpoint successfully submitted the transaction.
   */
  endpoint: string;

  /**
   * Time from submission to response in milliseconds.
   */
  latencyMs: number;
}


