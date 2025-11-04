/**
 * Effect-based transaction builder.
 *
 * @packageDocumentation
 */

import { Effect, pipe } from 'effect';
import type { Address, TransactionMessage } from 'gill';
// Note: getTransferSolInstruction is from @solana-program/system
// Users should install @solana-program/system and import it separately
import { TransactionBuilder } from '@pipeit/tx-core';
import {
  InsufficientFundsError,
  BlockhashExpiredError,
  NetworkError,
} from '@pipeit/tx-errors';
import { RpcService, WalletService } from './services.js';

/**
 * Error types for Effect-based transactions.
 */
export type TransactionEffectError =
  | InsufficientFundsError
  | BlockhashExpiredError
  | NetworkError;

/**
 * Build a transaction message as an Effect.
 * Requires fee payer and lifetime to be set on the builder.
 */
export function buildTransactionMessage(
  builder: TransactionBuilder<{ feePayer: true; lifetime: true }>
): Effect.Effect<
  TransactionMessage,
  TransactionEffectError,
  never
> {
  return Effect.sync(() => {
    return builder.build();
  });
}

/**
 * Build a transaction message with automatic fee payer and blockhash fetching.
 */
export function buildTransactionMessageWithAutoConfig(
  builder: TransactionBuilder
): Effect.Effect<
  TransactionMessage,
  TransactionEffectError,
  RpcService | WalletService
> {
  return Effect.gen(function* () {
    const rpcService = yield* RpcService;
    const walletService = yield* WalletService;
    const rpc = rpcService.getRpc();
    const feePayerAddress = walletService.getAddress();

    // Fetch latest blockhash
    const rpcWithBlockhash = rpc as typeof rpc & {
      getLatestBlockhash: () => { send: () => Promise<{ value: { blockhash: string; lastValidBlockHeight: bigint } }> };
    };
    const latestBlockhash = yield* pipe(
      Effect.tryPromise({
        try: () => rpcWithBlockhash.getLatestBlockhash().send(),
        catch: (error) =>
          new NetworkError(
            `Failed to fetch blockhash: ${String(error)}`,
            error
          ),
      }),
      Effect.map((result: { value: { blockhash: string; lastValidBlockHeight: bigint } }) => result.value)
    );

    // Set fee payer and lifetime on builder
    const configuredBuilder = builder
      .setFeePayer(feePayerAddress as Address)
      .setBlockhashLifetime(
        latestBlockhash.blockhash as import('gill').Blockhash,
        latestBlockhash.lastValidBlockHeight
      );

    return configuredBuilder.build();
  });
}

/**
 * Create a transfer transaction Effect.
 */
export function createTransferEffect(opts: {
  from: Address | { address: Address };
  to: Address;
  amount: bigint;
}): Effect.Effect<
  TransactionMessage,
  TransactionEffectError,
  RpcService | WalletService
> {
  // Note: Transfer instruction requires @solana-program/system
  // Users should add the instruction manually or install @solana-program/system
  // For now, we'll return an error Effect to guide users
  return Effect.fail(
    new NetworkError(
      'createTransferEffect requires @solana-program/system. ' +
      'Please install it and use: import { getTransferSolInstruction, lamports } from "@solana-program/system"; ' +
      'Then add the instruction to the builder manually.'
    )
  );

  // This code would work once @solana-program/system is available:
  // return Effect.gen(function* () {
  //   const builder = new TransactionBuilder({ version: 0 });
  //   const source = typeof opts.from === 'string' ? opts.from : opts.from.address;
  //   const instruction = getTransferSolInstruction({
  //     source: source as Address,
  //     destination: opts.to,
  //     amount: lamports(opts.amount),
  //   });
  //   const builderWithInstruction = builder.addInstruction(instruction);
  //   return yield* buildTransactionMessageWithAutoConfig(builderWithInstruction);
  // });
}

