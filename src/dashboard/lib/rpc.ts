import { createPublicClient, fallback, http } from 'viem';
import { robinhood } from 'viem/chains';
import { RPC_URLS } from '../config';

/**
 * One read-only client for everything that is not wallet-specific: log scans,
 * block timestamps, receipts. JSON-RPC batching folds the per-block timestamp
 * lookups into a handful of requests, and retries absorb the public endpoint's
 * occasional 429.
 */
export const rpc = createPublicClient({
  chain: robinhood,
  transport: fallback(
    RPC_URLS.map((url) =>
      http(url, {
        batch: { batchSize: 25, wait: 16 },
        retryCount: 2,
        retryDelay: 600,
        timeout: 20_000,
      }),
    ),
  ),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry a call when the public RPC rate-limits, with a growing pause. */
export async function withBackoff<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!/429|Too Many Requests|rate limit/i.test(msg)) throw err;
      await sleep(600 * (i + 1));
    }
  }
  throw last;
}

const blockTimeCache = new Map<bigint, number>();

/** Unix seconds for each block. Cached, since blocks never change. */
export async function blockTimestamps(blocks: bigint[]): Promise<Map<bigint, number>> {
  const missing = [...new Set(blocks)].filter((b) => !blockTimeCache.has(b));
  for (let i = 0; i < missing.length; i += 25) {
    const slice = missing.slice(i, i + 25);
    const got = await Promise.all(
      slice.map((blockNumber) => withBackoff(() => rpc.getBlock({ blockNumber, includeTransactions: false }))),
    );
    got.forEach((b) => blockTimeCache.set(b.number, Number(b.timestamp)));
  }
  const out = new Map<bigint, number>();
  blocks.forEach((b) => {
    const t = blockTimeCache.get(b);
    if (t !== undefined) out.set(b, t);
  });
  return out;
}
