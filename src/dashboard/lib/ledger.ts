import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_TOKEN } from '../config';

/**
 * The merchant ledger: profile + checkouts, one per connected wallet.
 *
 * There is no ZetaNexus backend in this repo, so the ledger lives in the
 * merchant's own browser, keyed by their address and versioned so the shape can
 * change later without corrupting old data. Nothing here is invented: quotes
 * come from the live price feed, blocks from the chain, settlements from real
 * transfers. Export/import in Settings is the backup path.
 */

export type Settlement = {
  txHash: `0x${string}`;
  logIndex: number;
  block: string; // bigint as string, JSON-safe
  value: string; // base units
  from: `0x${string}`;
  timestamp: number; // unix seconds
  matchedBy: 'auto' | 'manual';
};

export type Checkout = {
  id: string;
  orderRef: string;
  description: string;
  /** Decimal string in payout-token units, e.g. "250.00". */
  payout: string;
  payoutToken: `0x${string}`;
  settlementAddress: `0x${string}`;
  zec: { amount: string; rate: number; source: string; quotedAt: number };
  createdAt: number;
  createdBlock: string;
  expiresAt: number;
  /** Issued by the ZetaNexus API. Absent when no API is configured. */
  shieldedAddress?: string;
  apiId?: string;
  cancelledAt?: number;
  settlement?: Settlement;
};

export type Profile = {
  merchantName: string;
  settlementAddress: `0x${string}` | '';
  payoutToken: `0x${string}`;
  webhookUrl: string;
  webhookSecret: string;
  expiryMinutes: number;
};

export type Ledger = { v: 1; profile: Profile; checkouts: Checkout[] };

const VERSION = 1;
const keyFor = (address: string) => `zetanexus.ledger.v${VERSION}.${address.toLowerCase()}`;

export function newSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `whsec_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function newCheckoutId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `chk_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

function emptyLedger(): Ledger {
  return {
    v: 1,
    profile: {
      merchantName: '',
      settlementAddress: '',
      payoutToken: DEFAULT_TOKEN.address,
      webhookUrl: '',
      webhookSecret: newSecret(),
      expiryMinutes: 15,
    },
    checkouts: [],
  };
}

function isLedger(x: unknown): x is Ledger {
  return !!x && typeof x === 'object' && (x as Ledger).v === 1 && Array.isArray((x as Ledger).checkouts);
}

/* --- store: one cached snapshot per address, shared across components ------ */

const cache = new Map<string, Ledger>();
const listeners = new Map<string, Set<() => void>>();

function read(address: string): Ledger {
  const hit = cache.get(address);
  if (hit) return hit;
  let ledger = emptyLedger();
  try {
    const raw = localStorage.getItem(keyFor(address));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isLedger(parsed)) ledger = { ...ledger, ...parsed, profile: { ...ledger.profile, ...parsed.profile } };
    }
  } catch {
    /* storage blocked or corrupt: start clean, never throw into render */
  }
  cache.set(address, ledger);
  return ledger;
}

function write(address: string, next: Ledger) {
  cache.set(address, next);
  try {
    localStorage.setItem(keyFor(address), JSON.stringify(next));
  } catch {
    /* quota or private mode: keep the in-memory copy */
  }
  listeners.get(address)?.forEach((l) => l());
}

export function updateLedger(address: string, fn: (l: Ledger) => Ledger) {
  write(address, fn(read(address)));
}

export function replaceLedger(address: string, next: unknown): boolean {
  if (!isLedger(next)) return false;
  write(address, next);
  return true;
}

if (typeof window !== 'undefined') {
  // Another tab changed this wallet's ledger: drop the cache and re-read.
  window.addEventListener('storage', (e) => {
    if (!e.key?.startsWith(`zetanexus.ledger.v${VERSION}.`)) return;
    const address = e.key.split('.').pop() ?? '';
    cache.delete(address);
    listeners.get(address)?.forEach((l) => l());
  });
}

export function useLedger(address: string | undefined) {
  const addr = address?.toLowerCase() ?? '';
  const subscribe = useCallback(
    (l: () => void) => {
      if (!addr) return () => {};
      const set = listeners.get(addr) ?? new Set();
      set.add(l);
      listeners.set(addr, set);
      return () => set.delete(l);
    },
    [addr],
  );
  const get = useCallback(() => (addr ? read(addr) : EMPTY), [addr]);
  return useSyncExternalStore(subscribe, get, get);
}

const EMPTY = emptyLedger();

/* --- mutations ------------------------------------------------------------ */

export const ledgerActions = (address: string) => {
  const addr = address.toLowerCase();
  return {
    saveProfile: (patch: Partial<Profile>) =>
      updateLedger(addr, (l) => ({ ...l, profile: { ...l.profile, ...patch } })),
    addCheckout: (c: Checkout) => updateLedger(addr, (l) => ({ ...l, checkouts: [c, ...l.checkouts] })),
    patchCheckout: (id: string, patch: Partial<Checkout>) =>
      updateLedger(addr, (l) => ({
        ...l,
        checkouts: l.checkouts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      })),
    removeSettlement: (id: string) =>
      updateLedger(addr, (l) => ({
        ...l,
        checkouts: l.checkouts.map((c) => {
          if (c.id !== id) return c;
          const { settlement: _drop, ...rest } = c;
          void _drop;
          return rest;
        }),
      })),
    clear: () => write(addr, emptyLedger()),
  };
};
