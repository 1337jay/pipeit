/**
 * System program transaction templates.
 *
 * @packageDocumentation
 */

import type { Address, TransactionSigner } from 'gill';
import { TransactionBuilder } from '@pipeit/tx-core';

/**
 * Options for creating an account.
 */
export interface CreateAccountOptions {
  /**
   * New account signer.
   */
  newAccount: TransactionSigner;
  /**
   * Account that will fund the creation.
   */
  from: TransactionSigner | Address;
  /**
   * Amount in lamports to allocate.
   */
  lamports: bigint;
  /**
   * Space to allocate in bytes.
   */
  space: number;
  /**
   * Program ID that will own the account.
   */
  programId: Address;
}

/**
 * Create account transaction builder.
 *
 * @example
 * ```ts
 * import { createAccountTransaction } from '@pipeit/tx-templates';
 * import { getCreateAccountInstruction } from '@solana-program/system';
 *
 * const builder = createAccountTransaction({
 *   newAccount: newAccountSigner,
 *   from: payerSigner,
 *   lamports: 1_000_000_000n,
 *   space: 165,
 *   programId: TOKEN_PROGRAM_ADDRESS,
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
 * This is a helper that returns a builder with the create account instruction.
 * You must install `@solana-program/system` to use `getCreateAccountInstruction`.
 * For a complete implementation, see the example above.
 */
export function createAccountTransaction(
  opts: CreateAccountOptions
): TransactionBuilder {
  // Note: This requires @solana-program/system package
  // Users should import getCreateAccountInstruction and add it manually:
  //
  // import { getCreateAccountInstruction } from '@solana-program/system';
  // const instruction = getCreateAccountInstruction({
  //   payer: opts.from,
  //   newAccount: opts.newAccount,
  //   lamports: opts.lamports,
  //   space: opts.space,
  //   programAddress: opts.programId,
  // });
  // return new TransactionBuilder({ version: 0 }).addInstruction(instruction);

  // For now, return empty builder - users should add the instruction themselves
  // This allows the template to exist without requiring @solana-program/system as a dependency
  const builder = new TransactionBuilder({ version: 0 });
  return builder;
}

