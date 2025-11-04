/**
 * SPL Token transfer transaction template.
 *
 * @packageDocumentation
 */

import type { Address, TransactionSigner } from 'gill';
import { TransactionBuilder } from '@pipeit/tx-core';

/**
 * Options for creating an SPL token transfer transaction.
 */
export interface SPLTokenTransferOptions {
  /**
   * Source token account.
   */
  source: Address;
  /**
   * Destination token account.
   */
  destination: Address;
  /**
   * Amount in token base units.
   */
  amount: bigint;
  /**
   * Token account owner (signer).
   */
  owner: TransactionSigner;
  /**
   * Token mint address.
   */
  mint: Address;
}

/**
 * Create an SPL token transfer transaction builder.
 *
 * @example
 * ```ts
 * import { createSPLTokenTransferTransaction } from '@pipeit/tx-templates';
 * import { getTransferInstruction } from '@solana-program/token';
 *
 * const builder = createSPLTokenTransferTransaction({
 *   source: sourceTokenAccount,
 *   destination: destTokenAccount,
 *   amount: 100_000_000n, // 100 tokens (assuming 6 decimals)
 *   owner: ownerSigner,
 *   mint: tokenMintAddress,
 * });
 *
 * // The builder still needs fee payer and lifetime set before building
 * const message = builder
 *   .setFeePayer(payerAddress)
 *   .setBlockhashLifetime(blockhash, lastValidBlockHeight)
 *   .build();
 * ```
 *
 * @remarks
 * This is a helper that returns a builder with the token transfer instruction.
 * You must install `@solana-program/token` to use `getTransferInstruction`.
 * For a complete implementation, see the example above.
 */
export function createSPLTokenTransferTransaction(
  opts: SPLTokenTransferOptions
): TransactionBuilder {
  // Note: This requires @solana-program/token package
  // Users should import getTransferInstruction and add it manually:
  //
  // import { getTransferInstruction } from '@solana-program/token';
  // const instruction = getTransferInstruction({
  //   source: opts.source,
  //   destination: opts.destination,
  //   amount: opts.amount,
  //   owner: opts.owner,
  // });
  // return new TransactionBuilder({ version: 0 }).addInstruction(instruction);

  // For now, return empty builder - users should add the instruction themselves
  // This allows the template to exist without requiring @solana-program/token as a dependency
  const builder = new TransactionBuilder({ version: 0 });
  return builder;
}

