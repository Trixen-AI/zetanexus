import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Address } from 'viem';
import { DEFAULT_TOKEN, tokenByAddress, type PayoutToken } from './config';
import { ledgerActions, useLedger, type Ledger } from './lib/ledger';
import { findMatches, viewOf, type CheckoutView } from './lib/reconcile';
import { useIncomingTransfers, type IndexSnapshot, getIndex } from './lib/transfers';

/**
 * Everything the dashboard pages share about the connected merchant: their
 * ledger, where payouts land, which token pays out, and the live index of
 * incoming transfers on Robinhood Chain.
 */

type MerchantCtx = {
  wallet: Address;
  ledger: Ledger;
  actions: ReturnType<typeof ledgerActions>;
  settlementAddress: Address;
  token: PayoutToken;
  transfers: IndexSnapshot & { index: ReturnType<typeof getIndex> | null };
};

const Ctx = createContext<MerchantCtx | null>(null);

export function MerchantProvider({ wallet, children }: { wallet: Address; children: ReactNode }) {
  const ledger = useLedger(wallet);
  const actions = useMemo(() => ledgerActions(wallet), [wallet]);
  const settlementAddress = (ledger.profile.settlementAddress || wallet) as Address;
  const token = tokenByAddress(ledger.profile.payoutToken) ?? DEFAULT_TOKEN;
  const transfers = useIncomingTransfers(token.address, settlementAddress);

  // Persist new matches as real payouts arrive. This syncs chain state into the
  // ledger, so it belongs in an effect rather than in render.
  const { transfers: list, index } = transfers;
  useEffect(() => {
    if (!list.length) return;
    const matches = findMatches(ledger.checkouts, list, token.address, settlementAddress);
    matches.forEach((settlement, id) => actions.patchCheckout(id, { settlement }));
  }, [list, ledger.checkouts, token.address, settlementAddress, actions]);

  // Checkouts older than the scanned window pull the window back far enough to cover them.
  const oldestOpen = useMemo(() => {
    let min: bigint | null = null;
    for (const c of ledger.checkouts) {
      if (c.settlement || c.cancelledAt) continue;
      const b = BigInt(c.createdBlock);
      if (min === null || b < min) min = b;
    }
    return min;
  }, [ledger.checkouts]);
  const floor = transfers.floor;
  useEffect(() => {
    if (index && oldestOpen !== null && floor !== null && oldestOpen < floor) void index.ensureFrom(oldestOpen);
  }, [index, oldestOpen, floor]);

  const value = useMemo(
    () => ({ wallet, ledger, actions, settlementAddress, token, transfers }),
    [wallet, ledger, actions, settlementAddress, token, transfers],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMerchant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMerchant outside MerchantProvider');
  return ctx;
}

/** A clock for countdowns and expiry. Only components that call it re-render. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Checkouts with their derived status, newest first. */
export function useCheckoutViews(intervalMs = 5000): CheckoutView[] {
  const { ledger } = useMerchant();
  const now = useNow(intervalMs);
  return useMemo(
    () => ledger.checkouts.map((c) => viewOf(c, now)).sort((a, b) => b.createdAt - a.createdAt),
    [ledger.checkouts, now],
  );
}
