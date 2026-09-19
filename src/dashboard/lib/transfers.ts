import { useEffect, useSyncExternalStore } from 'react';
import { parseAbiItem, type Address } from 'viem';
import { BLOCKS_PER_DAY, INITIAL_SCAN_DAYS, SCAN_CHUNK } from '../config';
import { blockTimestamps, rpc, withBackoff } from './rpc';

/**
 * Incoming token transfers to one address on Robinhood Chain, read straight
 * from the chain with eth_getLogs (Blockscout sits behind a bot challenge, so
 * the RPC is the only reliable source).
 *
 * One index per (token, recipient), shared by every component that asks:
 *  - first sync reads the last INITIAL_SCAN_DAYS, newest chunk first,
 *  - later syncs only read blocks after the last head (cheap polling),
 *  - "load older" and ensureFrom() extend the floor on demand.
 */

export type Transfer = {
  id: string; // txHash:logIndex
  txHash: `0x${string}`;
  logIndex: number;
  block: bigint;
  from: Address;
  to: Address;
  value: bigint;
  timestamp: number | null; // unix seconds
};

export type IndexSnapshot = {
  transfers: Transfer[]; // newest first
  floor: bigint | null; // oldest block covered
  head: bigint | null; // newest block covered
  syncing: boolean;
  loadingOlder: boolean;
  error: string | null;
  lastSyncAt: number | null;
};

const TRANSFER = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

class TransferIndex {
  snap: IndexSnapshot = {
    transfers: [],
    floor: null,
    head: null,
    syncing: false,
    loadingOlder: false,
    error: null,
    lastSyncAt: null,
  };
  private listeners = new Set<() => void>();
  private byId = new Map<string, Transfer>();
  private queue: Promise<void> = Promise.resolve();
  private token: Address;
  private to: Address;

  constructor(token: Address, to: Address) {
    this.token = token;
    this.to = to;
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(patch: Partial<IndexSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** All chain work runs one job at a time, so ranges never overlap. */
  private enqueue(job: () => Promise<void>) {
    this.queue = this.queue.then(job, job);
    return this.queue;
  }

  /** Read [from, to] in chunks, newest first, halving on "too many logs". */
  private async scan(from: bigint, to: bigint) {
    let hi = to;
    let chunk = SCAN_CHUNK;
    while (hi >= from) {
      const lo = hi - chunk + 1n > from ? hi - chunk + 1n : from;
      try {
        const logs = await withBackoff(() =>
          rpc.getLogs({ address: this.token, event: TRANSFER, args: { to: this.to }, fromBlock: lo, toBlock: hi }),
        );
        const fresh: Transfer[] = [];
        for (const log of logs) {
          const id = `${log.transactionHash}:${log.logIndex}`;
          if (this.byId.has(id) || log.removed) continue;
          const t: Transfer = {
            id,
            txHash: log.transactionHash,
            logIndex: Number(log.logIndex),
            block: log.blockNumber,
            from: log.args.from as Address,
            to: log.args.to as Address,
            value: log.args.value as bigint,
            timestamp: null,
          };
          this.byId.set(id, t);
          fresh.push(t);
        }
        if (fresh.length) {
          const times = await blockTimestamps(fresh.map((t) => t.block));
          fresh.forEach((t) => (t.timestamp = times.get(t.block) ?? null));
          this.publish();
        }
        hi = lo - 1n;
        chunk = SCAN_CHUNK;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/exceeds limit|timed out|too large/i.test(msg) && chunk > 10_000n) {
          chunk /= 2n; // busy address or slow node: retry the same top with a smaller window
          continue;
        }
        throw err;
      }
    }
  }

  private publish() {
    const transfers = [...this.byId.values()].sort((a, b) =>
      a.block === b.block ? b.logIndex - a.logIndex : a.block > b.block ? -1 : 1,
    );
    this.set({ transfers });
  }

  sync = () =>
    this.enqueue(async () => {
      this.set({ syncing: true, error: null });
      try {
        const latest = await withBackoff(() => rpc.getBlockNumber());
        const { head } = this.snap;
        if (head === null) {
          const floor = latest - BigInt(BLOCKS_PER_DAY * INITIAL_SCAN_DAYS);
          this.set({ head: latest });
          await this.scan(floor > 0n ? floor : 0n, latest);
          this.set({ floor: floor > 0n ? floor : 0n });
        } else if (latest > head) {
          await this.scan(head + 1n, latest);
          this.set({ head: latest });
        }
        this.set({ syncing: false, lastSyncAt: Date.now() });
      } catch (err) {
        this.set({ syncing: false, error: err instanceof Error ? err.message.split('\n')[0] : String(err) });
      }
    });

  /** Extend history back to `block` (used for checkouts older than the window). */
  ensureFrom = (block: bigint) =>
    this.enqueue(async () => {
      const { floor } = this.snap;
      if (floor === null || block >= floor) return;
      this.set({ loadingOlder: true, error: null });
      try {
        await this.scan(block, floor - 1n);
        this.set({ floor: block, loadingOlder: false });
      } catch (err) {
        this.set({ loadingOlder: false, error: err instanceof Error ? err.message.split('\n')[0] : String(err) });
      }
    });

  loadOlder = (days = INITIAL_SCAN_DAYS) => {
    const { floor } = this.snap;
    if (floor === null || floor === 0n) return Promise.resolve();
    const target = floor - BigInt(BLOCKS_PER_DAY * days);
    return this.ensureFrom(target > 0n ? target : 0n);
  };
}

const indexes = new Map<string, TransferIndex>();

export function getIndex(token: Address, to: Address) {
  const key = `${token.toLowerCase()}:${to.toLowerCase()}`;
  let idx = indexes.get(key);
  if (!idx) {
    idx = new TransferIndex(token, to);
    indexes.set(key, idx);
  }
  return idx;
}

const IDLE: IndexSnapshot = {
  transfers: [],
  floor: null,
  head: null,
  syncing: false,
  loadingOlder: false,
  error: null,
  lastSyncAt: null,
};
const noop = () => () => {};

/**
 * Live view of incoming transfers. Polls for new blocks every `pollMs` while the
 * tab is visible; pass null for `to` to stay idle (e.g. no wallet yet).
 */
export function useIncomingTransfers(token: Address, to: Address | null | undefined, pollMs = 15_000) {
  const idx = to ? getIndex(token, to) : null;
  const snap = useSyncExternalStore(
    idx ? idx.subscribe : noop,
    () => (idx ? idx.snap : IDLE),
    () => (idx ? idx.snap : IDLE),
  );

  useEffect(() => {
    if (!idx) return;
    void idx.sync();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void idx.sync();
    }, pollMs);
    return () => window.clearInterval(t);
  }, [idx, pollMs]);

  return { ...snap, index: idx };
}
