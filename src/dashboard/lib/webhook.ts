import type { CheckoutView } from './reconcile';
import { fmtToken } from './format';

/**
 * Webhook payloads and HMAC-SHA256 signatures, computed with WebCrypto.
 * The signature header format matches the one documented on the website:
 * `sha256=<hex digest of the raw body>`.
 */

const enc = new TextEncoder();

export async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison, so a verifier cannot be timed into leaking bytes. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const EVENT_FOR_STATUS = {
  awaiting_payment: 'checkout.created',
  settled: 'settlement_complete',
  partial: 'settlement_partial',
  expired: 'checkout.expired',
  cancelled: 'checkout.cancelled',
} as const;

/** The body ZetaNexus would POST for this checkout's current status. */
export function webhookBody(c: CheckoutView) {
  const body = {
    event: EVENT_FOR_STATUS[c.status],
    checkout_id: c.apiId ?? c.id,
    order_ref: c.orderRef,
    status: c.status,
    zec_amount: c.zec.amount,
    payout: `${fmtToken(c.payoutUnits, c.decimals)} ${c.symbol}`,
    settlement_address: c.settlementAddress,
    settlement_tx: c.settlement?.txHash ?? null,
    settlement_block: c.settlement ? Number(c.settlement.block) : null,
    created_at: new Date(c.createdAt).toISOString(),
    expires_at: new Date(c.expiresAt).toISOString(),
  };
  return JSON.stringify(body, null, 2);
}

export async function signedCurl(url: string, secret: string, body: string) {
  const sig = await hmacHex(secret, body);
  const escaped = body.replace(/'/g, `'\\''`);
  return `curl -X POST '${url || 'https://your-server.example/webhooks/zetanexus'}' \\
  -H 'content-type: application/json' \\
  -H 'x-zetanexus-signature: sha256=${sig}' \\
  --data '${escaped}'`;
}
