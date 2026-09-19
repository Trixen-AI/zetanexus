import { tokenByAddress } from '../config';
import type { Checkout, Settlement } from './ledger';
import type { Transfer } from './transfers';
import { toUnits } from './format';

/**
 * Settlement matching.
 *
 * The liquidity provider pays the merchant an ordinary token transfer on
 * Robinhood Chain. A checkout is settled when a transfer of exactly the payout
 * amount reaches its settlement address in or after the block the checkout was
 * created in. Each transfer can settle one checkout only; older checkouts claim
 * first. Amounts that do not match exactly are never auto-matched: a merchant
 * can attach them by hand from the Verify page, which records them as partial
 * or over-paid rather than guessing.
 */

export type CheckoutStatus = 'awaiting_payment' | 'settled' | 'partial' | 'expired' | 'cancelled';

export type CheckoutView = Checkout & {
  status: CheckoutStatus;
  late: boolean; // settled, but after the quote expired
  payoutUnits: bigint;
  decimals: number;
  symbol: string;
};

export function payoutUnits(c: Checkout) {
  const t = tokenByAddress(c.payoutToken);
  return { units: toUnits(c.payout, t?.decimals ?? 6) ?? 0n, decimals: t?.decimals ?? 6, symbol: t?.symbol ?? 'TOKEN' };
}

export function viewOf(c: Checkout, now: number): CheckoutView {
  const { units, decimals, symbol } = payoutUnits(c);
  let status: CheckoutStatus;
  let late = false;
  if (c.cancelledAt && !c.settlement) status = 'cancelled';
  else if (c.settlement) {
    const paid = BigInt(c.settlement.value);
    status = paid < units ? 'partial' : 'settled';
    late = c.settlement.timestamp * 1000 > c.expiresAt;
  } else status = now > c.expiresAt ? 'expired' : 'awaiting_payment';
  return { ...c, status, late, payoutUnits: units, decimals, symbol };
}

/**
 * New automatic matches for checkouts that have none yet. Returns checkout id
 * to settlement; the caller persists them.
 */
export function findMatches(checkouts: Checkout[], transfers: Transfer[], token: string, to: string) {
  const claimed = new Set(checkouts.flatMap((c) => (c.settlement ? [`${c.settlement.txHash}:${c.settlement.logIndex}`] : [])));
  const open = checkouts
    .filter(
      (c) =>
        !c.settlement &&
        !c.cancelledAt &&
        c.payoutToken.toLowerCase() === token.toLowerCase() &&
        c.settlementAddress.toLowerCase() === to.toLowerCase(),
    )
    .sort((a, b) => (BigInt(a.createdBlock) < BigInt(b.createdBlock) ? -1 : 1));

  // oldest transfer first, so the earliest payment settles the earliest order
  const pool = [...transfers].reverse();
  const out = new Map<string, Settlement>();

  for (const c of open) {
    const { units } = payoutUnits(c);
    if (units === 0n) continue;
    const created = BigInt(c.createdBlock);
    const hit = pool.find((t) => !claimed.has(t.id) && t.block >= created && t.value === units && t.timestamp !== null);
    if (!hit) continue;
    claimed.add(hit.id);
    out.set(c.id, {
      txHash: hit.txHash,
      logIndex: hit.logIndex,
      block: hit.block.toString(),
      value: hit.value.toString(),
      from: hit.from,
      timestamp: hit.timestamp ?? 0,
      matchedBy: 'auto',
    });
  }
  return out;
}

/** Which checkout, if any, a transfer settled. */
export function checkoutForTransfer(checkouts: Checkout[]) {
  const map = new Map<string, Checkout>();
  checkouts.forEach((c) => {
    if (c.settlement) map.set(`${c.settlement.txHash}:${c.settlement.logIndex}`, c);
  });
  return map;
}

export const STATUS_LABEL: Record<CheckoutStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  settled: 'Settled',
  partial: 'Partial',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export const STATUS_TONE: Record<CheckoutStatus, 'signal' | 'settle' | 'shield' | 'muted' | 'alert'> = {
  awaiting_payment: 'signal',
  settled: 'settle',
  partial: 'alert',
  expired: 'muted',
  cancelled: 'muted',
};
