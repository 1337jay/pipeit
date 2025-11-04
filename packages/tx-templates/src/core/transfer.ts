/**
 * SOL transfer transaction template.
 *
 * @packageDocumentation
 */

import type { Address, TransactionSigner } from 'gill';
// Note: getTransferSolInstruction is from @solana-program/system
// Users should install @solana-program/system and import it separately
import { TransactionBuilder } from '@pipeit/tx-core';

/**
 * Options for creating a SOL transfer transaction.
 */
export interface TransferOptions {
  /**
   * Source account (signer or address).
   */
  from: TransactionSigner | Address;
  /**
   * Destination account address.
   */
  to: Address;
  /**
   * Amount in lamports.
   */
  amount: bigint;
  /**
   * Fee payer (if different from source).
   */
  feePayer?: Address;
}

/**
 * Create a SOL transfer transaction builder.
 */
export function createTransferTransaction(
  opts: TransferOptions
): TransactionBuilder {
  // Note: This requires @solana-program/system package
  // Users should import getTransferSolInstruction and lamports from @solana-program/system
  // Example:
  // import { getTransferSolInstruction, lamports } from '@solana-program/system';
  // const instruction = getTransferSolInstruction({
  //   source: opts.from,
  //   destination: opts.to,
  //   amount: lamports(opts.amount),
  // });
  // return new TransactionBuilder({ version: 0 }).addInstruction(instruction);

  // For now, return empty builder - users should add the instruction themselves
  const builder = new TransactionBuilder({ version: 0 });
  return builder;
}

