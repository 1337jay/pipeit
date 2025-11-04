/**
 * Helper functions for common transaction operations.
 *
 * @packageDocumentation
 */

import type { 
  Rpc, 
  TransactionSigner, 
  RpcSubscriptions, 
  GetLatestBlockhashApi,
  GetEpochInfoApi,
  GetSignatureStatusesApi,
  SendTransactionApi,
  SignatureNotificationsApi,
  SlotNotificationsApi,
} from 'gill';
import { transaction } from './transaction-builder.js';
import type { TransactionBuilderConfig } from './transaction-builder.js';

/**
 * Quick transfer SOL between accounts.
 * 
 * Note: This helper requires the instruction to be created separately.
 * Use Gill's getTransferSolInstruction from 'gill/programs' to create the instruction.
 */
export async function quickTransfer(
  rpc: Rpc<GetEpochInfoApi & GetSignatureStatusesApi & SendTransactionApi & GetLatestBlockhashApi>,
  rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi & SlotNotificationsApi>,
  opts: {
    instruction: Parameters<typeof transaction>[0] extends undefined ? never : any; // Instruction type from gill
    feePayer: TransactionSigner;
    config?: TransactionBuilderConfig;
  }
): Promise<string> {
  const builder = transaction(opts.config);
  
  // Note: Users need to add the instruction themselves
  // This is intentional - keeps the API flexible
  return builder
    .addInstruction(opts.instruction)
    .execute({
      feePayer: opts.feePayer,
      rpc,
      rpcSubscriptions,
    });
}

