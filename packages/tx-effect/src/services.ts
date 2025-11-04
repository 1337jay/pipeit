/**
 * Service definitions for dependency injection.
 *
 * @packageDocumentation
 */

import { Context, Layer } from 'effect';
import type { Rpc, TransactionSigner } from 'gill';

/**
 * RPC service tag.
 */
export class RpcService extends Context.Tag('RpcService')<
  RpcService,
  {
    readonly getRpc: () => Rpc<unknown>;
  }
>() {}

/**
 * Wallet service tag.
 */
export class WalletService extends Context.Tag('WalletService')<
  WalletService,
  {
    readonly getSigner: () => TransactionSigner;
    readonly getAddress: () => string;
  }
>() {}

/**
 * Create RPC service layer.
 */
export function createRpcServiceLayer(rpc: Rpc<unknown>) {
  return Layer.succeed(RpcService, {
    getRpc: () => rpc,
  });
}

/**
 * Create wallet service layer.
 */
export function createWalletServiceLayer(
  signer: TransactionSigner,
  address: string
) {
  return Layer.succeed(WalletService, {
    getSigner: () => signer,
    getAddress: () => address,
  });
}

