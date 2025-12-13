/**
 * Execution strategy orchestration.
 *
 * Resolves preset strategies to full configurations and executes
 * transactions with the appropriate submission paths.
 *
 * @packageDocumentation
 */

import type {
  ExecutionConfig,
  ExecutionPreset,
  ResolvedExecutionConfig,
  ExecutionContext,
  ExecutionResult,
} from './types.js';
import {
  sendBundle,
  getBundleStatuses,
  JITO_BLOCK_ENGINES,
  JITO_DEFAULT_TIP_LAMPORTS,
} from './jito.js';
import { submitParallel, submitToRpc } from './parallel.js';

// ============================================================================
// Strategy Presets
// ============================================================================

/**
 * Default configurations for each execution preset.
 *
 * - 'standard': Default RPC only, no Jito, no parallel
 * - 'economical': Jito bundle only (good balance)
 * - 'fast': Jito + parallel RPC race (max speed)
 */
const PRESET_CONFIGS: Record<ExecutionPreset, ResolvedExecutionConfig> = {
  standard: {
    jito: {
      enabled: false,
      tipLamports: 0n,
      blockEngineUrl: JITO_BLOCK_ENGINES.mainnet,
      mevProtection: false,
    },
    parallel: {
      enabled: false,
      endpoints: [],
      raceWithDefault: true,
    },
  },
  economical: {
    jito: {
      enabled: true,
      tipLamports: JITO_DEFAULT_TIP_LAMPORTS,
      blockEngineUrl: JITO_BLOCK_ENGINES.mainnet,
      mevProtection: true,
    },
    parallel: {
      enabled: false,
      endpoints: [],
      raceWithDefault: true,
    },
  },
  fast: {
    jito: {
      enabled: true,
      tipLamports: JITO_DEFAULT_TIP_LAMPORTS,
      blockEngineUrl: JITO_BLOCK_ENGINES.mainnet,
      mevProtection: true,
    },
    parallel: {
      enabled: true,
      endpoints: [],
      raceWithDefault: true,
    },
  },
};

// ============================================================================
// Strategy Resolution
// ============================================================================

/**
 * Check if a value is an execution preset string.
 */
function isPreset(config: ExecutionConfig): config is ExecutionPreset {
  return typeof config === 'string';
}

/**
 * Resolve execution configuration to a fully populated config object.
 *
 * Converts preset strings to full configs and fills in defaults for
 * partial configurations.
 *
 * @param config - User-provided execution config (preset or object)
 * @returns Fully resolved execution configuration
 *
 * @example
 * ```ts
 * // Preset
 * const resolved = resolveExecutionConfig('fast');
 *
 * // Partial config - missing values filled with defaults
 * const resolved = resolveExecutionConfig({
 *   jito: { enabled: true, tipLamports: 50_000n },
 * });
 * ```
 */
export function resolveExecutionConfig(
  config: ExecutionConfig | undefined
): ResolvedExecutionConfig {
  // Default to standard if not provided
  if (!config) {
    return { ...PRESET_CONFIGS.standard };
  }

  // If it's a preset string, return the preset config
  if (isPreset(config)) {
    return { ...PRESET_CONFIGS[config] };
  }

  // Merge user config with defaults
  const jitoConfig = config.jito;
  const parallelConfig = config.parallel;

  return {
    jito: {
      enabled: jitoConfig?.enabled ?? false,
      tipLamports: jitoConfig?.tipLamports ?? JITO_DEFAULT_TIP_LAMPORTS,
      blockEngineUrl:
        typeof jitoConfig?.blockEngineUrl === 'string' &&
        jitoConfig.blockEngineUrl in JITO_BLOCK_ENGINES
          ? JITO_BLOCK_ENGINES[jitoConfig.blockEngineUrl as keyof typeof JITO_BLOCK_ENGINES]
          : jitoConfig?.blockEngineUrl ?? JITO_BLOCK_ENGINES.mainnet,
      mevProtection: jitoConfig?.mevProtection ?? true,
    },
    parallel: {
      enabled: parallelConfig?.enabled ?? false,
      endpoints: parallelConfig?.endpoints ?? [],
      raceWithDefault: parallelConfig?.raceWithDefault ?? true,
    },
  };
}

// ============================================================================
// Strategy Execution
// ============================================================================

/**
 * Error thrown when execution strategy fails.
 */
export class ExecutionStrategyError extends Error {
  readonly jitoError: Error | undefined;
  readonly parallelError: Error | undefined;

  constructor(
    message: string,
    options?: { jitoError?: Error; parallelError?: Error }
  ) {
    super(message);
    this.name = 'ExecutionStrategyError';
    this.jitoError = options?.jitoError;
    this.parallelError = options?.parallelError;
  }
}

/**
 * Execute a signed transaction using the resolved strategy.
 *
 * This is the core function that routes the transaction to the
 * appropriate submission paths based on configuration.
 *
 * @param transaction - Base64-encoded signed transaction
 * @param config - Resolved execution configuration
 * @param context - Execution context (RPC URL, abort signal, etc.)
 * @returns Execution result with signature and metadata
 *
 * @example
 * ```ts
 * const result = await executeWithStrategy(
 *   base64Tx,
 *   resolveExecutionConfig('fast'),
 *   { rpcUrl: 'https://api.mainnet-beta.solana.com' }
 * );
 * ```
 */
export async function executeWithStrategy(
  transaction: string,
  config: ResolvedExecutionConfig,
  context: ExecutionContext & { rpcUrl?: string }
): Promise<ExecutionResult> {
  const { jito, parallel } = config;
  const { rpcUrl, abortSignal } = context;

  const startTime = performance.now();

  // Case 1: Neither Jito nor parallel enabled - standard RPC submission
  if (!jito.enabled && !parallel.enabled) {
    if (!rpcUrl) {
      throw new ExecutionStrategyError(
        'RPC URL required for standard submission'
      );
    }

    const signature = await submitToRpc(rpcUrl, transaction, {
      skipPreflight: true,
      ...(abortSignal && { abortSignal }),
    });

    return {
      signature,
      landedVia: 'rpc',
      latencyMs: Math.round(performance.now() - startTime),
    };
  }

  // Case 2: Jito only - submit bundle
  if (jito.enabled && !parallel.enabled) {
    const bundleId = await sendBundle([transaction], {
      blockEngineUrl: jito.blockEngineUrl,
      ...(abortSignal && { abortSignal }),
    });

    // Get the signature from bundle status (first transaction's signature)
    // Note: For single-tx bundles, we need to extract the signature
    const signature = await waitForBundleSignature(bundleId, {
      blockEngineUrl: jito.blockEngineUrl,
      ...(abortSignal && { abortSignal }),
    });

    return {
      signature,
      landedVia: 'jito',
      latencyMs: Math.round(performance.now() - startTime),
      bundleId,
    };
  }

  // Case 3: Parallel only - submit to multiple RPCs
  if (!jito.enabled && parallel.enabled) {
    const endpoints = buildEndpointList(rpcUrl, parallel);

    if (endpoints.length === 0) {
      throw new ExecutionStrategyError(
        'No endpoints available for parallel submission'
      );
    }

    const result = await submitParallel({
      endpoints,
      transaction,
      skipPreflight: true,
      ...(abortSignal && { abortSignal }),
    });

    return {
      signature: result.signature,
      landedVia: 'parallel',
      latencyMs: result.latencyMs,
      endpoint: result.endpoint,
    };
  }

  // Case 4: Both Jito and parallel - race them
  return executeRaceStrategy(transaction, config, context, startTime);
}

/**
 * Build the list of endpoints for parallel submission.
 */
function buildEndpointList(
  defaultRpcUrl: string | undefined,
  parallelConfig: ResolvedExecutionConfig['parallel']
): string[] {
  const endpoints: string[] = [];

  // Add user-provided endpoints
  if (parallelConfig.endpoints.length > 0) {
    endpoints.push(...parallelConfig.endpoints);
  }

  // Add default RPC if configured to race with it
  if (parallelConfig.raceWithDefault && defaultRpcUrl) {
    // Avoid duplicates
    if (!endpoints.includes(defaultRpcUrl)) {
      endpoints.push(defaultRpcUrl);
    }
  }

  return endpoints;
}

/**
 * Execute the race strategy - Jito vs parallel RPC.
 *
 * Both paths are started simultaneously, and the first to succeed wins.
 * This maximizes landing probability at the cost of potentially paying
 * both Jito tip and priority fees.
 */
async function executeRaceStrategy(
  transaction: string,
  config: ResolvedExecutionConfig,
  context: ExecutionContext & { rpcUrl?: string },
  startTime: number
): Promise<ExecutionResult> {
  const { jito, parallel } = config;
  const { rpcUrl, abortSignal } = context;

  // Create abort controller to cancel the loser
  const abortController = new AbortController();
  const combinedSignal = abortSignal
    ? combineAbortSignals(abortSignal, abortController.signal)
    : abortController.signal;

  const endpoints = buildEndpointList(rpcUrl, parallel);

  // Track errors from each path
  let jitoError: Error | undefined;
  let parallelError: Error | undefined;

  // Create Jito submission promise
  const jitoPromise = (async (): Promise<ExecutionResult> => {
    try {
      const bundleId = await sendBundle([transaction], {
        blockEngineUrl: jito.blockEngineUrl,
        abortSignal: combinedSignal,
      });

      const signature = await waitForBundleSignature(bundleId, {
        blockEngineUrl: jito.blockEngineUrl,
        abortSignal: combinedSignal,
      });

      return {
        signature,
        landedVia: 'jito',
        latencyMs: Math.round(performance.now() - startTime),
        bundleId,
      };
    } catch (error) {
      jitoError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  })();

  // Create parallel submission promise (only if endpoints available)
  const parallelPromise =
    endpoints.length > 0
      ? (async (): Promise<ExecutionResult> => {
          try {
            const result = await submitParallel({
              endpoints,
              transaction,
              skipPreflight: true,
              abortSignal: combinedSignal,
            });

            return {
              signature: result.signature,
              landedVia: 'parallel',
              latencyMs: result.latencyMs,
              endpoint: result.endpoint,
            };
          } catch (error) {
            parallelError =
              error instanceof Error ? error : new Error(String(error));
            throw error;
          }
        })()
      : Promise.reject(new Error('No parallel endpoints'));

  try {
    // Race Jito vs parallel
    const result = await Promise.any([jitoPromise, parallelPromise]);

    // Cancel the loser
    abortController.abort();

    return result;
  } catch (error) {
    // Both failed
    abortController.abort();

    const errorOptions: { jitoError?: Error; parallelError?: Error } = {};
    if (jitoError) errorOptions.jitoError = jitoError;
    if (parallelError) errorOptions.parallelError = parallelError;

    throw new ExecutionStrategyError(
      'All execution paths failed',
      errorOptions
    );
  }
}

/**
 * Wait for a bundle to land and return the transaction signature.
 *
 * Polls getBundleStatuses until the bundle is confirmed or timeout.
 */
async function waitForBundleSignature(
  bundleId: string,
  options: {
    blockEngineUrl: string;
    abortSignal?: AbortSignal;
    maxAttempts?: number;
    pollIntervalMs?: number;
  }
): Promise<string> {
  const {
    blockEngineUrl,
    abortSignal,
    maxAttempts = 30,
    pollIntervalMs = 500,
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (abortSignal?.aborted) {
      throw new Error('Bundle confirmation aborted');
    }

    const [status] = await getBundleStatuses([bundleId], {
      blockEngineUrl,
      ...(abortSignal && { abortSignal }),
    });

    if (status) {
      // Bundle found - return the first transaction signature
      if (status.transactions.length > 0) {
        return status.transactions[0];
      }
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Bundle ${bundleId} not confirmed within timeout`);
}

/**
 * Combine two abort signals into one.
 */
function combineAbortSignals(
  signal1: AbortSignal,
  signal2: AbortSignal
): AbortSignal {
  const controller = new AbortController();

  const abort = () => controller.abort();

  signal1.addEventListener('abort', abort);
  signal2.addEventListener('abort', abort);

  if (signal1.aborted || signal2.aborted) {
    controller.abort();
  }

  return controller.signal;
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Check if an execution config enables Jito.
 */
export function isJitoEnabled(config: ExecutionConfig | undefined): boolean {
  const resolved = resolveExecutionConfig(config);
  return resolved.jito.enabled;
}

/**
 * Check if an execution config enables parallel submission.
 */
export function isParallelEnabled(config: ExecutionConfig | undefined): boolean {
  const resolved = resolveExecutionConfig(config);
  return resolved.parallel.enabled;
}

/**
 * Get the tip amount for an execution config.
 * Returns 0 if Jito is not enabled.
 */
export function getTipAmount(config: ExecutionConfig | undefined): bigint {
  const resolved = resolveExecutionConfig(config);
  return resolved.jito.enabled ? resolved.jito.tipLamports : 0n;
}


