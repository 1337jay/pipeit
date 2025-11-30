/**
 * Pipe - Fluent API for composing and executing DeFi actions.
 * 
 * @example
 * ```ts
 * import { pipe } from '@pipeit/actions'
 * import { jupiter } from '@pipeit/actions/adapters'
 * 
 * await pipe({
 *   rpc,
 *   rpcSubscriptions,
 *   signer,
 *   adapters: { swap: jupiter() }
 * })
 *   .swap({ inputMint: SOL, outputMint: USDC, amount: 10_000_000n })
 *   .execute()
 * ```
 * 
 * @packageDocumentation
 */

import { TransactionBuilder } from '@pipeit/tx-builder';
import type {
  ActionContext,
  ActionExecutor,
  ActionResult,
  PipeConfig,
  PipeResult,
  SwapParams,
} from './types.js';

/**
 * Fluent builder for composing DeFi actions into atomic transactions.
 */
export class Pipe {
  private config: PipeConfig;
  private actions: ActionExecutor[] = [];
  private context: ActionContext;

  constructor(config: PipeConfig) {
    this.config = config;
    this.context = {
      signer: config.signer,
      rpc: config.rpc,
      rpcSubscriptions: config.rpcSubscriptions,
    };
  }

  /**
   * Add a custom action to the pipe.
   * 
   * @param action - Action executor function
   * @returns The pipe instance for chaining
   * 
   * @example
   * ```ts
   * pipe.add(async (ctx) => ({
   *   instructions: [myCustomInstruction],
   * }))
   * ```
   */
  add(action: ActionExecutor): this {
    this.actions.push(action);
    return this;
  }

  /**
   * Add a swap action using the configured swap adapter.
   * 
   * @param params - Swap parameters
   * @returns The pipe instance for chaining
   * @throws If no swap adapter is configured
   * 
   * @example
   * ```ts
   * pipe.swap({
   *   inputMint: 'So11111111111111111111111111111111111111112',
   *   outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
   *   amount: 10_000_000n,
   *   slippageBps: 50
   * })
   * ```
   */
  swap(params: SwapParams): this {
    if (!this.config.adapters?.swap) {
      throw new Error(
        'No swap adapter configured. Pass a swap adapter in pipe config:\n' +
        'pipe({ ..., adapters: { swap: jupiter() } })'
      );
    }

    const executor = this.config.adapters.swap.swap(params);
    this.actions.push(executor);
    return this;
  }

  /**
   * Execute all actions in the pipe as a single atomic transaction.
   * 
   * @returns The transaction signature and action results
   * 
   * @example
   * ```ts
   * const { signature } = await pipe
   *   .swap({ inputMint: SOL, outputMint: USDC, amount: 10_000_000n })
   *   .execute()
   * 
   * console.log('Transaction:', signature)
   * ```
   */
  async execute(): Promise<PipeResult> {
    if (this.actions.length === 0) {
      throw new Error('No actions to execute. Add at least one action to the pipe.');
    }

    // Execute all actions to get their instructions
    const actionResults: ActionResult[] = [];
    const allInstructions: Array<import('@solana/instructions').Instruction> = [];
    let totalComputeUnits = 0;

    for (const action of this.actions) {
      const result = await action(this.context);
      actionResults.push(result);
      allInstructions.push(...result.instructions);
      
      if (result.computeUnits) {
        totalComputeUnits += result.computeUnits;
      }
    }

    // Build and execute the transaction using tx-builder
    const signature = await new TransactionBuilder({
      rpc: this.config.rpc,
      // Use suggested compute units or default high value for DeFi
      computeUnits: totalComputeUnits > 0 ? totalComputeUnits : 400_000,
      logLevel: 'verbose',
    })
      .setFeePayerSigner(this.config.signer)
      .addInstructions(allInstructions)
      .execute({
        rpcSubscriptions: this.config.rpcSubscriptions,
        commitment: 'confirmed',
      });

    return {
      signature,
      actionResults,
    };
  }

  /**
   * Simulate the transaction without executing.
   * Useful for checking if a transaction would succeed.
   * 
   * @returns Simulation results
   */
  async simulate(): Promise<{
    success: boolean;
    logs: string[];
    unitsConsumed?: bigint;
    error?: unknown;
  }> {
    if (this.actions.length === 0) {
      throw new Error('No actions to simulate. Add at least one action to the pipe.');
    }

    // Execute all actions to get their instructions
    const allInstructions: Array<import('@solana/instructions').Instruction> = [];
    let totalComputeUnits = 0;

    for (const action of this.actions) {
      const result = await action(this.context);
      allInstructions.push(...result.instructions);
      
      if (result.computeUnits) {
        totalComputeUnits += result.computeUnits;
      }
    }

    // Build and simulate using tx-builder
    const result = await new TransactionBuilder({
      rpc: this.config.rpc,
      computeUnits: totalComputeUnits > 0 ? totalComputeUnits : 400_000,
    })
      .setFeePayerSigner(this.config.signer)
      .addInstructions(allInstructions)
      .simulate();

    // Build response object, conditionally adding optional properties
    const response: {
      success: boolean;
      logs: string[];
      unitsConsumed?: bigint;
      error?: unknown;
    } = {
      success: result.err === null,
      logs: result.logs ?? [],
    };

    if (result.unitsConsumed !== undefined) {
      response.unitsConsumed = result.unitsConsumed;
    }

    if (result.err !== null) {
      response.error = result.err;
    }

    return response;
  }
}

/**
 * Create a new pipe for composing DeFi actions.
 * 
 * @param config - Pipe configuration including RPC clients, signer, and adapters
 * @returns A new Pipe instance
 * 
 * @example
 * ```ts
 * import { pipe } from '@pipeit/actions'
 * import { jupiter } from '@pipeit/actions/adapters'
 * import { SOL, USDC } from '@pipeit/actions/tokens'
 * 
 * const result = await pipe({
 *   rpc,
 *   rpcSubscriptions,
 *   signer,
 *   adapters: { swap: jupiter() }
 * })
 *   .swap({ inputMint: SOL, outputMint: USDC, amount: 10_000_000n })
 *   .execute()
 * 
 * console.log('Swap executed:', result.signature)
 * ```
 */
export function pipe(config: PipeConfig): Pipe {
  return new Pipe(config);
}
