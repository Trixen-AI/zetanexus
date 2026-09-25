import { useEffect, useState } from 'react';
import { CONTRACTS, TOKEN, ZZEC } from '../data/site';

/**
 * Minimal read-only Robinhood Chain access for the marketing page. Plain fetch
 * JSON-RPC (no viem), so the website bundle stays free of wallet code. Every
 * figure it returns comes from the chain or from ZEAL's public reserve API.
 */

const RPCS = [
  (import.meta.env.VITE_RHC_RPC_URL as string | undefined)?.trim() || 'https://rpc.mainnet.chain.robinhood.com',
  'https://rpc.ordofi.network',
];

async function rpc<T = string>(method: string, params: unknown[]): Promise<T> {
  let last: unknown;
  for (const url of RPCS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message);
      return j.result as T;
    } catch (err) {
      last = err; // CORS hiccup or rate limit on one endpoint: try the next
    }
  }
  throw last;
}

const call = (to: string, data: string) => rpc('eth_call', [{ to, data }, 'latest']);
const word = (hex: string, i = 0) => hex.slice(2 + i * 64, 2 + (i + 1) * 64);
const asAddress = (hex: string) => `0x${word(hex).slice(24)}`;
const asBig = (hex: string) => (hex && hex !== '0x' ? BigInt(`0x${word(hex)}`) : 0n);
const pad = (addr: string) => addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');

/* --- zZEC backing ---------------------------------------------------------- */

export type Backing = { status: 'loading' | 'live' | 'error'; reserve: number | null; owed: number | null; at: string | null };

export function useZzecBacking(): Backing {
  const [b, setB] = useState<Backing>({ status: 'loading', reserve: null, owed: null, at: null });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [supplyHex, reserve] = await Promise.all([
          call(ZZEC.token, '0x18160ddd'),
          fetch(ZZEC.reserveApi).then((r) => r.json() as Promise<{ zec: number; at: string }>),
        ]);
        const owed = Number(asBig(supplyHex)) / 10 ** ZZEC.decimals;
        if (alive) setB({ status: 'live', reserve: Number(reserve.zec), owed, at: reserve.at });
      } catch {
        if (alive) setB((prev) => ({ ...prev, status: 'error' }));
      }
    };
    void load();
    const t = window.setInterval(load, 120_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);
  return b;
}

/* --- $ZRAIL contract checks ------------------------------------------------ */

/** Function selectors whose presence would break a "never" promise. */
const FORBIDDEN: Record<string, string[]> = {
  Mint: ['40c10f19', 'a0712d68'], // mint(address,uint256), mint(uint256)
  Blacklist: ['44337ea1', 'f9f92be4', '0ecb93c0', 'e4997dc5'], // blacklist / addToBlacklist variants
  Pause: ['8456cb59', '3f4ba83a'], // pause(), unpause()
  Upgrade: ['3659cfe6', '4f1ef286'], // upgradeTo, upgradeToAndCall
};
const IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a94f76df2dc4f8ab8c';

function selectorsIn(code: string): Set<string> {
  const b = code.replace(/^0x/, '');
  const found = new Set<string>();
  for (let i = 0; i < b.length; i += 2) {
    const op = parseInt(b.slice(i, i + 2), 16);
    if (op === 0x63) found.add(b.slice(i + 2, i + 10));
    if (op >= 0x60 && op <= 0x7f) i += (op - 0x5f) * 2;
  }
  return found;
}

export type Check = { label: string; state: 'pass' | 'fail' | 'unknown'; detail: string };
export type ContractReport = {
  status: 'no-contract' | 'loading' | 'ready' | 'error';
  checks: Check[];
  feeRecipient: string | null;
  feeRecipientIsContract: boolean | null;
  distributorLive: boolean;
};

const DISTRIBUTOR = CONTRACTS.distributor.trim().toLowerCase();

export function useContractReport(): ContractReport {
  const ca = TOKEN.contract;
  const [r, setR] = useState<ContractReport>({
    status: ca ? 'loading' : 'no-contract',
    checks: [],
    feeRecipient: null,
    feeRecipientIsContract: null,
    distributorLive: false,
  });

  useEffect(() => {
    if (!ca) return;
    let alive = true;
    (async () => {
      try {
        const [code, impl] = await Promise.all([rpc('eth_getCode', [ca, 'latest']), rpc('eth_getStorageAt', [ca, IMPL_SLOT, 'latest'])]);
        const sels = selectorsIn(code);
        const checks: Check[] = Object.entries(FORBIDDEN).map(([label, list]) => {
          const hit = list.find((s) => sels.has(s));
          if (label === 'Upgrade' && asBig(impl) !== 0n) return { label, state: 'fail', detail: 'Proxy implementation slot is set' };
          return hit ? { label, state: 'fail', detail: `Function 0x${hit} is present` } : { label, state: 'pass', detail: 'Not in the bytecode' };
        });

        // Launchpad tokens expose their curve; the curve holds the fee settings.
        let feeRecipient: string | null = null;
        let feeRecipientIsContract: boolean | null = null;
        let taxBps: bigint | null = null;
        try {
          const curve = asAddress(await call(ca, '0x7165485d'));
          feeRecipient = asAddress(await call(curve, '0x3cd1fb8f')).toLowerCase();
          taxBps = asBig(await call(curve, '0xc1bb8901'));
          const rc = await rpc('eth_getCode', [feeRecipient, 'latest']);
          feeRecipientIsContract = rc.length > 2;
        } catch {
          /* not a launchpad token, or no curve yet */
        }
        checks.push(
          taxBps === null
            ? { label: 'Raise the fee', state: 'unknown', detail: 'Fee is not set on this contract' }
            : { label: 'Raise the fee', state: 'pass', detail: `Creator fee fixed at ${Number(taxBps) / 100}% in the curve` },
        );

        // Team tokens: what the deployer still holds.
        try {
          const deployer = asAddress(await call(ca, '0xd5f39488'));
          const bal = asBig(await call(ca, `0x70a08231${pad(deployer)}`));
          const supply = asBig(await call(ca, '0x18160ddd'));
          const share = supply > 0n ? Number((bal * 10000n) / supply) / 100 : 0;
          checks.push(
            bal === 0n
              ? { label: 'Hold team tokens', state: 'pass', detail: 'Deployer wallet holds 0' }
              : { label: 'Hold team tokens', state: 'fail', detail: `Deployer holds ${share}% of supply` },
          );
        } catch {
          checks.push({ label: 'Hold team tokens', state: 'unknown', detail: 'No deployer recorded on the token' });
        }

        if (alive)
          setR({
            status: 'ready',
            checks,
            feeRecipient,
            feeRecipientIsContract,
            distributorLive: !!DISTRIBUTOR && feeRecipient === DISTRIBUTOR && !!feeRecipientIsContract,
          });
      } catch {
        if (alive) setR((p) => ({ ...p, status: 'error' }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [ca]);

  return r;
}

export const explorerAddress = (a: string) => `https://robinhoodchain.blockscout.com/address/${a}`;
