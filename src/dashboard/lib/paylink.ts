import { isAddress } from 'viem';
import type { Checkout } from './ledger';

/**
 * Customer payment links. A checkout lives in the merchant's browser, so the
 * link carries what the customer page needs, base64url-encoded in the path.
 * The page never trusts the link for payment state: settlement status is read
 * from Robinhood Chain every time.
 */

export type PayPayload = {
  v: 1;
  id: string;
  m: string; // merchant name
  o: string; // order ref
  p: string; // payout amount (decimal)
  t: `0x${string}`; // payout token
  s: `0x${string}`; // settlement address
  b: string; // created block
  e: number; // expires at (ms)
  z: string; // quoted ZEC amount
  r: number; // quoted rate (USD per ZEC)
  a?: string; // shielded address, when issued
};

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64Url = (s: string) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function payPayload(c: Checkout, merchantName: string): PayPayload {
  return {
    v: 1,
    id: c.apiId ?? c.id,
    m: merchantName || 'ZRail merchant',
    o: c.orderRef,
    p: c.payout,
    t: c.payoutToken,
    s: c.settlementAddress,
    b: c.createdBlock,
    e: c.expiresAt,
    z: c.zec.amount,
    r: c.zec.rate,
    ...(c.shieldedAddress ? { a: c.shieldedAddress } : {}),
  };
}

export const encodePay = (p: PayPayload) => toB64Url(JSON.stringify(p));

export function decodePay(token: string): PayPayload | null {
  try {
    const p = JSON.parse(fromB64Url(token)) as PayPayload;
    const ok =
      p.v === 1 &&
      typeof p.id === 'string' &&
      typeof p.o === 'string' &&
      /^\d+(\.\d+)?$/.test(p.p) &&
      isAddress(p.t) &&
      isAddress(p.s) &&
      /^\d+$/.test(p.b) &&
      Number.isFinite(p.e) &&
      /^\d+(\.\d+)?$/.test(p.z);
    return ok ? p : null;
  } catch {
    return null;
  }
}

export const payUrl = (p: PayPayload) => `${window.location.origin}/pay/${encodePay(p)}`;

/** ZIP-321 payment URI for a Zcash wallet. */
export const zcashUri = (address: string, amount: string, memo: string) =>
  `zcash:${address}?amount=${amount}&message=${encodeURIComponent(memo)}`;
