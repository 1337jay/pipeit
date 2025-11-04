/**
 * Base transaction builder with type-safe state tracking.
 *
 * @packageDocumentation
 */

import type {
  Address,
  TransactionMessage,
  Instruction,
  Blockhash,
} from 'gill';
import {
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageLifetimeUsingDurableNonce,
  appendTransactionMessageInstructions,
} from 'gill';
import type { BuilderState, RequiredState, BuilderConfig, LifetimeConstraint } from './types.js';
import { InvalidTransactionError } from '@pipeit/tx-errors';

/**
 * Type-safe transaction builder that tracks required fields.
 *
 * @example
 * ```ts
 * const builder = new TransactionBuilder({ version: 0 })
 *   .setFeePayer(address('...'))
 *   .setBlockhashLifetime(blockhash, lastValidBlockHeight)
 *   .addInstruction(instruction)
 *   .build(); // Type-safe: only compiles when all required fields are set
 * ```
 */
export class TransactionBuilder<TState extends BuilderState = BuilderState> {
  private feePayer?: Address;
  private lifetime?: LifetimeConstraint;
  private instructions: Instruction[] = [];
  private readonly version: 0 | 'legacy';

  constructor(config: BuilderConfig = {}) {
    this.version = config.version ?? 0;
  }

  /**
   * Set the fee payer for the transaction.
   */
  setFeePayer<TAddress extends string>(
    feePayer: Address<TAddress>
  ): TransactionBuilder<TState & { feePayer: true }> {
    const builder = this.clone();
    builder.feePayer = feePayer;
    return builder as TransactionBuilder<TState & { feePayer: true }>;
  }

  /**
   * Set blockhash lifetime for the transaction.
   */
  setBlockhashLifetime(
    blockhash: Blockhash,
    lastValidBlockHeight: bigint
  ): TransactionBuilder<TState & { lifetime: true }> {
    const builder = this.clone();
    builder.lifetime = {
      type: 'blockhash',
      blockhash,
      lastValidBlockHeight,
    };
    return builder as TransactionBuilder<TState & { lifetime: true }>;
  }

  /**
   * Set durable nonce lifetime for the transaction.
   */
  setDurableNonceLifetime(
    nonce: string,
    nonceAccountAddress: Address,
    nonceAuthorityAddress: Address
  ): TransactionBuilder<TState & { lifetime: true }> {
    const builder = this.clone();
    builder.lifetime = {
      type: 'nonce',
      nonce,
      nonceAccountAddress,
      nonceAuthorityAddress,
    };
    return builder as TransactionBuilder<TState & { lifetime: true }>;
  }

  /**
   * Add a single instruction to the transaction.
   */
  addInstruction(
    instruction: Instruction
  ): TransactionBuilder<TState> {
    const builder = this.clone();
    builder.instructions.push(instruction);
    return builder;
  }

  /**
   * Add multiple instructions to the transaction.
   */
  addInstructions(
    instructions: readonly Instruction[]
  ): TransactionBuilder<TState> {
    const builder = this.clone();
    builder.instructions.push(...instructions);
    return builder;
  }

  /**
   * Build the transaction message.
   * Only available when all required fields (feePayer, lifetime) are set.
   */
  build(
    this: TransactionBuilder<RequiredState>
  ): TransactionMessage {
    if (!this.feePayer) {
      throw new InvalidTransactionError(
        'Fee payer is required',
        ['feePayer']
      );
    }

    if (!this.lifetime) {
      throw new InvalidTransactionError(
        'Lifetime constraint is required',
        ['lifetime']
      );
    }

    let message: TransactionMessage = createTransactionMessage({ version: this.version }) as TransactionMessage;

    // Set fee payer
    message = setTransactionMessageFeePayer(this.feePayer, message) as TransactionMessage;

    // Set lifetime
    if (this.lifetime.type === 'blockhash') {
      message = setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: this.lifetime.blockhash as Blockhash,
          lastValidBlockHeight: this.lifetime.lastValidBlockHeight,
        },
        message
      ) as TransactionMessage;
    } else {
      message = setTransactionMessageLifetimeUsingDurableNonce(
        {
          nonce: this.lifetime.nonce as unknown as Parameters<
            typeof setTransactionMessageLifetimeUsingDurableNonce
          >[0]['nonce'],
          nonceAccountAddress: this.lifetime.nonceAccountAddress,
          nonceAuthorityAddress: this.lifetime.nonceAuthorityAddress,
        },
        message
      ) as TransactionMessage;
    }

    // Add instructions
    if (this.instructions.length > 0) {
      message = appendTransactionMessageInstructions(this.instructions, message) as TransactionMessage;
    }

    return message;
  }

  /**
   * Clone the builder for immutability.
   */
  private clone(): TransactionBuilder<TState> {
    const builder = new TransactionBuilder<TState>({ version: this.version });
    if (this.feePayer !== undefined) {
      builder.feePayer = this.feePayer;
    }
    if (this.lifetime !== undefined) {
      builder.lifetime = this.lifetime;
    }
    builder.instructions = [...this.instructions];
    return builder;
  }
}

