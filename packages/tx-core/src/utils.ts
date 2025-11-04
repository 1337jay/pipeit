/**
 * Shared utilities for transaction building.
 *
 * @packageDocumentation
 */

import type { Address } from 'gill';

/**
 * Check if a value is defined (not null or undefined).
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if an address is valid.
 */
export function isValidAddress(address: unknown): address is Address {
  return typeof address === 'string' && address.length > 0;
}

/**
 * Format lamports as SOL.
 */
export function formatLamports(lamports: bigint, decimals = 9): string {
  const divisor = BigInt(10 ** decimals);
  const whole = lamports / divisor;
  const fractional = lamports % divisor;
  return fractional === 0n
    ? whole.toString()
    : `${whole}.${fractional.toString().padStart(decimals, '0')}`;
}

/**
 * Parse SOL to lamports.
 */
export function parseLamports(sol: string | number, decimals = 9): bigint {
  const num = typeof sol === 'string' ? parseFloat(sol) : sol;
  return BigInt(Math.floor(num * 10 ** decimals));
}






