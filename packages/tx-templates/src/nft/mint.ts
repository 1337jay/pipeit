/**
 * NFT minting transaction template.
 *
 * @packageDocumentation
 */

import type { Address, TransactionSigner } from 'gill';
import { TransactionBuilder } from '@pipeit/tx-core';

/**
 * Options for creating an NFT mint transaction.
 */
export interface NFTMintOptions {
  /**
   * Mint authority (signer).
   */
  mintAuthority: TransactionSigner;
  /**
   * Metadata URI.
   */
  uri: string;
  /**
   * Collection address (optional).
   */
  collection?: Address;
  /**
   * Name of the NFT.
   */
  name: string;
  /**
   * Symbol for the NFT.
   */
  symbol: string;
}

/**
 * Create an NFT mint transaction builder.
 *
 * @example
 * ```ts
 * import { createNFTMintTransaction } from '@pipeit/tx-templates';
 * // Using Metaplex or similar SDK
 * import { createMintNftInstruction } from '@metaplex-foundation/mpl-token-metadata';
 *
 * const builder = createNFTMintTransaction({
 *   mintAuthority: mintAuthoritySigner,
 *   uri: 'https://example.com/metadata.json',
 *   name: 'My NFT',
 *   symbol: 'NFT',
 *   collection: collectionAddress, // optional
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
 * This is a helper template. NFT minting typically requires:
 * 1. Creating a mint account (system program)
 * 2. Creating a metadata account (Metaplex Token Metadata program)
 * 3. Creating a master edition account (Metaplex)
 *
 * You can use Metaplex SDK, @solana-program/token, or build instructions manually.
 * For a complete implementation, see Metaplex documentation or build instructions step-by-step.
 */
export function createNFTMintTransaction(opts: NFTMintOptions): TransactionBuilder {
  // Note: NFT minting is complex and typically requires multiple instructions:
  // 1. Create mint account (using @solana-program/token or system program)
  // 2. Create metadata account (using Metaplex Token Metadata program)
  // 3. Create master edition (using Metaplex)
  //
  // Users should build these instructions manually or use a library like Metaplex SDK.
  // This template provides the structure but requires users to add instructions themselves.

  // For now, return empty builder - users should add instructions themselves
  // This allows the template to exist without requiring Metaplex as a dependency
  const builder = new TransactionBuilder({ version: 0 });
  return builder;
}

