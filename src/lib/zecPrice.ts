import { useSyncExternalStore } from 'react';

/**
 * Live ZEC/USD price, shared by every component on the page.
 *
 * One module-level store, one poll: components subscribe through
 * useSyncExternalStore, so five components showing the price still cost one
 * request a minute. CoinGecko is the primary source (it also gives the 24h
 * change); Coinbase's spot endpoint is the fallback. Both allow browser CORS.
 *
 * If both fail the store reports `error` and keeps the last good price it had,
 * marked stale. It never invents a number.
 */

export type ZecPrice = {
  status: 'loading' | 'live' | 'stale' | 'error';
  usd: number | null;
  change24h: number | null;
  source: 'CoinGecko' | 'Coinbase' | null;
  updatedAt: number | null;
};

const POLL_MS = 60_000;
const TIMEOUT_MS = 8_000;

let state: ZecPrice = { status: 'loading', usd: null, change24h: null, source: null, updatedAt: null };
const listeners = new Set<() => void>();
let timer: number | undefined;
let inflight = false;

function set(next: ZecPrice) {
  state = next;
  listeners.forEach((l) => l());
}

async function getJson(url: string) {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(t);
  }
}

async function fromCoinGecko() {
  const data = await getJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true',
  );
  const usd = Number(data?.zcash?.usd);
  if (!Number.isFinite(usd) || usd <= 0) throw new Error('bad CoinGecko payload');
  const change = Number(data?.zcash?.usd_24h_change);
  return { usd, change24h: Number.isFinite(change) ? change : null, source: 'CoinGecko' as const };
}

async function fromCoinbase() {
  const data = await getJson('https://api.coinbase.com/v2/prices/ZEC-USD/spot');
  const usd = Number(data?.data?.amount);
  if (!Number.isFinite(usd) || usd <= 0) throw new Error('bad Coinbase payload');
  return { usd, change24h: null, source: 'Coinbase' as const };
}

async function refresh() {
  if (inflight) return;
  inflight = true;
  try {
    let quote;
    try {
      quote = await fromCoinGecko();
    } catch {
      quote = await fromCoinbase();
    }
    set({ status: 'live', ...quote, updatedAt: Date.now() });
  } catch {
    set(state.usd ? { ...state, status: 'stale' } : { ...state, status: 'error' });
  } finally {
    inflight = false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

const getSnapshot = () => state;

export function useZecPrice() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* --- formatting ----------------------------------------------------------- */

const usdFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatUsd = (n: number) => usdFmt.format(n);

/** ZEC to 8 decimals, the precision a Zcash amount is quoted in. */
export const formatZec = (n: number) => n.toFixed(8);

/** Shorter ZEC figure for large display sizes. */
export const formatZecShort = (n: number) => (n >= 1 ? n.toFixed(4) : n.toFixed(6));

/** ZEC needed to pay out `usd` at the live rate, or null while no price is known. */
export function zecFor(usd: number, price: ZecPrice) {
  return price.usd ? usd / price.usd : null;
}

export function priceLabel(price: ZecPrice) {
  if (price.status === 'loading') return 'Fetching live price';
  if (price.status === 'error') return 'Price feed unavailable';
  const time = price.updatedAt
    ? new Date(price.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  return `${price.status === 'stale' ? 'Last price' : 'Live'} via ${price.source} ${time}`.trim();
}
