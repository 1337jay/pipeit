/**
 * Opinionated transaction builder wrapping Gill with smart defaults.
 *
 * @packageDocumentation
 */

import { createTransaction, sendAndConfirmTransactionWithSignersFactory } from 'gill';
import type { 
  TransactionSigner, 
  Instruction, 
  Rpc, 
  RpcSubscriptions, 
  GetLatestBlockhashApi,
  GetEpochInfoApi,
  GetSignatureStatusesApi,
  SendTransactionApi,
  SignatureNotificationsApi,
  SlotNotificationsApi,
  SendAndConfirmTransactionWithSignersFunction,
} from 'gill';

/**
 * Configuration for opinionated transaction builder.
 */
export interface TransactionBuilderConfig {
  /**
   * Auto-retry failed transactions.
   * - `true`: Use default retry (3 attempts, exponential backoff)
   * - `false`: No retry
   * - Object: Custom retry configuration
   */
  autoRetry?: boolean | { maxAttempts: number; backoff: 'linear' | 'exponential' };
  
  /**
   * Priority fee level for transactions.
   */
  priorityLevel?: 'none' | 'low' | 'medium' | 'high' | 'veryHigh';
  
  /**
   * Compute unit limit.
   * - `'auto'`: Use default (200,000)
   * - `number`: Specific limit
   */
  computeUnitLimit?: 'auto' | number;
  
  /**
   * Logging level.
   */
  logLevel?: 'silent' | 'minimal' | 'verbose';
  
  /**
   * Transaction version.
   * - `'auto'`: Auto-detect based on instructions
   * - `0`: Versioned transaction
   * - `'legacy'`: Legacy transaction
   */
  version?: 'auto' | 0 | 'legacy';
}

/**
 * Priority fee presets in micro-lamports.
 */
const PRIORITY_FEE_PRESETS: Record<Exclude<TransactionBuilderConfig['priorityLevel'], undefined>, bigint> = {
  none: 0n,
  low: 1_000n,
  medium: 10_000n,
  high: 50_000n,
  veryHigh: 100_000n,
};

/**
 * Opinionated transaction builder with smart defaults.
 * Wraps Gill's functions with opinionated patterns.
 */
export class OpinionatedTransactionBuilder {
  private instructions: Instruction[] = [];
  private config: Required<Omit<TransactionBuilderConfig, 'version'>> & { version: TransactionBuilderConfig['version'] };
  
  constructor(config: TransactionBuilderConfig = {}) {
    // Opinionated defaults
    this.config = {
      autoRetry: { maxAttempts: 3, backoff: 'exponential' },
      priorityLevel: 'medium',
      computeUnitLimit: 'auto',
      logLevel: 'minimal',
      version: config.version ?? 'auto',
    };
  }
  
  /**
   * Add an instruction to the transaction.
   */
  addInstruction(instruction: Instruction): this {
    this.instructions.push(instruction);
    return this;
  }
  
  /**
   * Add multiple instructions to the transaction.
   */
  addInstructions(instructions: Instruction[]): this {
    this.instructions.push(...instructions);
    return this;
  }
  
  /**
   * Get priority fee based on configuration.
   */
  private getPriorityFee(): bigint {
    return PRIORITY_FEE_PRESETS[this.config.priorityLevel];
  }
  
  /**
   * Get compute unit limit based on configuration.
   */
  private getComputeUnitLimit(): number | undefined {
    if (this.config.computeUnitLimit === 'auto') {
      return 200_000; // Safe default
    }
    return this.config.computeUnitLimit;
  }
  
  /**
   * Execute the transaction with opinionated defaults.
   */
  async execute(params: {
    feePayer: TransactionSigner;
    rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi & GetLatestBlockhashApi>;
    rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>;
    commitment?: 'processed' | 'confirmed' | 'finalized';
  }): Promise<string> {
    const { feePayer, rpc, rpcSubscriptions, commitment = 'confirmed' } = params;
    
    // Fetch latest blockhash (Gill's sendAndConfirm can handle this, but we do it explicitly for better control)
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    
    // Use Gill's createTransaction with smart defaults
    const computeUnitLimit = this.getComputeUnitLimit();
    const createTransactionParams: Parameters<typeof createTransaction>[0] = {
      feePayer,
      instructions: this.instructions,
      ...(computeUnitLimit !== undefined && { computeUnitLimit }),
      computeUnitPrice: this.getPriorityFee(),
      latestBlockhash,
    };
    
    // Only add version if explicitly set (not 'auto')
    if (this.config.version !== 'auto' && this.config.version !== undefined) {
      createTransactionParams.version = this.config.version;
    }
    
    const transactionMessage = createTransaction(createTransactionParams);
    
    // Use Gill's sendAndConfirmTransactionWithSignersFactory
    const sendAndConfirm = sendAndConfirmTransactionWithSignersFactory({ 
      rpc, 
      rpcSubscriptions 
    });
    
    // Add opinionated retry logic if enabled
    if (this.config.autoRetry) {
      return this.executeWithRetry(sendAndConfirm, transactionMessage, commitment);
    }
    
    return sendAndConfirm(transactionMessage, { commitment });
  }
  
  /**
   * Execute transaction with retry logic.
   */
  private async executeWithRetry(
    sendAndConfirm: SendAndConfirmTransactionWithSignersFunction,
    transaction: any,
    commitment: 'processed' | 'confirmed' | 'finalized'
  ): Promise<string> {
    const retryConfig = this.config.autoRetry === true 
      ? { maxAttempts: 3, backoff: 'exponential' as const }
      : this.config.autoRetry;
    
    if (!retryConfig || typeof retryConfig === 'boolean') {
      throw new Error('Invalid retry configuration');
    }
    
    const { maxAttempts, backoff } = retryConfig;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (this.config.logLevel !== 'silent') {
          console.log(`[Pipeit] Transaction attempt ${attempt}/${maxAttempts}`);
        }
        
        return await sendAndConfirm(transaction, { commitment });
      } catch (error) {
        if (attempt === maxAttempts) {
          if (this.config.logLevel === 'verbose') {
            console.error(`[Pipeit] Transaction failed after ${maxAttempts} attempts:`, error);
          }
          throw error;
        }
        
        const delay = backoff === 'exponential' 
          ? Math.pow(2, attempt - 1) * 1000 
          : attempt * 1000;
        
        if (this.config.logLevel === 'verbose') {
          console.log(`[Pipeit] Retrying in ${delay}ms...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Transaction failed after retries');
  }
}

/**
 * Create a new opinionated transaction builder.
 * Simple factory function for general purpose use.
 */
export function transaction(config?: TransactionBuilderConfig): OpinionatedTransactionBuilder {
  return new OpinionatedTransactionBuilder(config);
}

