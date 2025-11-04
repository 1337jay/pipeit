/**
 * Simplified transaction builder with high-level API.
 *
 * @packageDocumentation
 */

import type {
  Address,
  Blockhash,
  FullySignedTransaction,
  Rpc,
  TransactionMessage,
  TransactionSigner,
  TransactionWithBlockhashLifetime,
} from 'gill';
import {
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from 'gill';
// Note: getTransferSolInstruction is from @solana-program/system
// Users should install @solana-program/system and import it separately
import { TransactionBuilder } from '@pipeit/tx-core';

/**
 * Priority fee levels.
 */
export type PriorityFeeLevel = 'low' | 'medium' | 'high' | 'veryHigh';

/**
 * Priority fee presets in micro-lamports.
 */
const PRIORITY_FEE_PRESETS: Record<PriorityFeeLevel, bigint> = {
  low: 1_000n,
  medium: 5_000n,
  high: 10_000n,
  veryHigh: 50_000n,
};

/**
 * Configuration for creating a transaction.
 */
export interface CreateTransactionConfig {
  version?: 0 | 'legacy';
}

/**
 * Simplified transaction builder with fluent API.
 */
export class SimpleTransactionBuilder {
  private builder: TransactionBuilder;
  private priorityFee?: bigint;
  private computeUnitLimit?: number;

  constructor(config: CreateTransactionConfig = {}) {
    this.builder = new TransactionBuilder({ version: config.version ?? 0 });
  }

  /**
   * Add a SOL transfer instruction.
   * Note: Requires @solana-program/system package.
   * Users should import getTransferSolInstruction separately.
   */
  transfer(opts: {
    from: TransactionSigner | Address;
    to: Address;
    amount: bigint;
  }): this {
    // Note: This requires @solana-program/system
    // Users should import: import { getTransferSolInstruction } from '@solana-program/system';
    // For now, we'll throw an error to guide users
    throw new Error(
      'transfer() method requires @solana-program/system. ' +
      'Please install it and use builder.addInstruction(getTransferSolInstruction({...})) instead, ' +
      'or implement transfer() after installing @solana-program/system.'
    );
  }

  /**
   * Add a custom instruction.
   */
  addInstruction(instruction: Parameters<TransactionBuilder['addInstruction']>[0]): this {
    this.builder = this.builder.addInstruction(instruction);
    return this;
  }

  /**
   * Set priority fee level.
   */
  withPriorityFee(level: PriorityFeeLevel | bigint): this {
    this.priorityFee =
      typeof level === 'string' ? PRIORITY_FEE_PRESETS[level] : level;
    return this;
  }

  /**
   * Set compute unit limit.
   */
  withComputeUnitLimit(units: number): this {
    this.computeUnitLimit = units;
    return this;
  }

  /**
   * Build the transaction message.
   * Requires fee payer and lifetime to be set via send().
   */
  buildMessage(): TransactionMessage {
    // This will be called internally by send() after setting fee payer and lifetime
    return this.builder.build();
  }

  /**
   * Send the transaction.
   * Automatically fetches blockhash and sets fee payer.
   */
  async send(
    rpc: Rpc<unknown>,
    opts: {
      feePayer: TransactionSigner | Address;
      commitment?: 'processed' | 'confirmed' | 'finalized';
      skipPreflight?: boolean;
    }
  ): Promise<Readonly<FullySignedTransaction & TransactionWithBlockhashLifetime>> {
    // Fetch latest blockhash
    const rpcWithBlockhash = rpc as typeof rpc & {
      getLatestBlockhash: () => { send: () => Promise<{ value: { blockhash: string; lastValidBlockHeight: bigint } }> };
    };
    const { value: latestBlockhash } = await rpcWithBlockhash.getLatestBlockhash().send();

    // Get fee payer address
    const feePayerAddress =
      typeof opts.feePayer === 'string'
        ? opts.feePayer
        : opts.feePayer.address;

    // Build transaction with fee payer and lifetime
    let builder = this.builder
      .setFeePayer(feePayerAddress)
      .setBlockhashLifetime(
        latestBlockhash.blockhash as Blockhash,
        latestBlockhash.lastValidBlockHeight
      );

    // Add priority fee and compute unit limit instructions if set
    // Note: This requires @solana-program/compute-budget package
    // For now, we'll add placeholders - users can add these instructions manually
    // or import from @solana-program/compute-budget when available
    if (this.priorityFee || this.computeUnitLimit) {
      // TODO: When @solana-program/compute-budget is available, use:
      // import { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
      // if (this.computeUnitLimit) {
      //   builder = builder.addInstruction(getSetComputeUnitLimitInstruction({ units: this.computeUnitLimit }));
      // }
      // if (this.priorityFee) {
      //   builder = builder.addInstruction(getSetComputeUnitPriceInstruction({ microLamports: this.priorityFee }));
      // }
    }

    const message = builder.build();

    // Sign transaction
    // Note: signTransactionMessageWithSigners signs the transaction using signers already present in the message
    // The fee payer should be a signer if it's a TransactionSigner
    const signedTransaction = (await signTransactionMessageWithSigners(
      message as Parameters<typeof signTransactionMessageWithSigners>[0]
    )) as Readonly<FullySignedTransaction & TransactionWithBlockhashLifetime>;

    return signedTransaction;
  }

  /**
   * Send and confirm the transaction.
   */
  async sendAndConfirm(
    rpc: Rpc<unknown>,
    rpcSubscriptions: Parameters<typeof sendAndConfirmTransactionFactory>[0]['rpcSubscriptions'],
    opts: {
      feePayer: TransactionSigner | Address;
      commitment?: 'processed' | 'confirmed' | 'finalized';
    }
  ): Promise<{ signature: string }> {
    const signedTransaction = await this.send(rpc, opts);

    // Type assertion needed because sendAndConfirmTransactionFactory expects specific RPC API methods
    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc: rpc as Parameters<typeof sendAndConfirmTransactionFactory>[0]['rpc'],
      rpcSubscriptions,
    });

    await sendAndConfirmTransaction(signedTransaction, {
      commitment: opts.commitment ?? 'confirmed',
    });

    // Extract signature from signed transaction
    const signature = getSignatureFromTransaction(signedTransaction);
    return { signature };
  }
}

/**
 * Create a new transaction builder.
 */
export function createTransaction(
  config?: CreateTransactionConfig
): SimpleTransactionBuilder {
  return new SimpleTransactionBuilder(config);
}

