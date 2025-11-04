/**
 * Effect combinators for transactions.
 *
 * @packageDocumentation
 */

import { Effect, Schedule, Duration, pipe } from 'effect';
import type { TransactionMessage } from 'gill';
import type { TransactionEffectError } from './effect-builder.js';

/**
 * Retry transaction with exponential backoff.
 */
export function retryTransaction<E extends TransactionEffectError>(
  effect: Effect.Effect<TransactionMessage, E, never>
): Effect.Effect<TransactionMessage, E, never> {
  return pipe(
    effect,
    Effect.retry(
      Schedule.exponential(Duration.millis(100)).pipe(
        Schedule.intersect(Schedule.recurs(3))
      )
    )
  );
}

/**
 * Add timeout to transaction Effect.
 * Note: This will add TimeoutException to the error type.
 */
export function timeoutTransaction(
  effect: Effect.Effect<TransactionMessage, TransactionEffectError, never>,
  timeout: Duration.Duration | Duration.DurationInput
): Effect.Effect<TransactionMessage, TransactionEffectError | { _tag: 'TimeoutException' }, never> {
  const duration =
    typeof timeout === 'string' || typeof timeout === 'number' || typeof timeout === 'bigint' || Array.isArray(timeout)
      ? Duration.decode(timeout)
      : timeout;

  return pipe(effect, Effect.timeout(duration));
}

/**
 * Catch specific error types and provide fallback.
 */
export function catchTransactionError<E extends TransactionEffectError>(
  effect: Effect.Effect<TransactionMessage, E, never>,
  handler: (error: E) => Effect.Effect<TransactionMessage, never, never>
): Effect.Effect<TransactionMessage, never, never> {
  return pipe(effect, Effect.catchAll(handler));
}

