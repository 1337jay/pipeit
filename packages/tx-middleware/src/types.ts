/**
 * Middleware types and interfaces.
 *
 * @packageDocumentation
 */

import type { TransactionMessage, Transaction, Rpc } from 'gill';
import type { TransactionErrorType } from '@pipeit/tx-errors';

/**
 * Result of executing a transaction.
 */
export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: TransactionErrorType;
}

/**
 * Next function in middleware chain.
 */
export type Next = () => Promise<TransactionResult>;

/**
 * Middleware function that wraps transaction execution.
 */
export type Middleware = (
  tx: TransactionMessage | Transaction,
  context: MiddlewareContext,
  next: Next
) => Promise<TransactionResult>;

/**
 * Context passed to middleware.
 */
export interface MiddlewareContext {
  rpc?: Rpc<unknown>;
  attempt?: number;
  maxAttempts?: number;
  [key: string]: unknown;
}

