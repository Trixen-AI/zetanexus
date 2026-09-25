import type { Address } from 'viem';

/**
 * Dashboard configuration. Every value here was checked against the live chain:
 * chain id 0x1237 (4663) from eth_chainId, USDG symbol/decimals from eth_call,
 * and the public RPC's CORS headers. Sources: docs.robinhood.com/chain/connecting
 * and docs.robinhood.com/chain/contracts.
 */

export const ENV = {
  reownProjectId: (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined)?.trim() ?? '',
  apiUrl: ((import.meta.env.VITE_ZRAIL_API_URL as string | undefined)?.trim() ?? '').replace(/\/+$/, ''),
  rpcUrl:
    (import.meta.env.VITE_RHC_RPC_URL as string | undefined)?.trim() || 'https://rpc.mainnet.chain.robinhood.com',
};

/**
 * RPC endpoints, in order of preference. The official endpoint occasionally
 * answers with a duplicated `Access-Control-Allow-Origin: *,*` header, which
 * browsers reject; the second public endpoint (listed in viem's chain
 * definition, same chain id 0x1237, CORS-open) takes over when that happens.
 */
export const RPC_URLS = [...new Set([ENV.rpcUrl, 'https://rpc.mainnet.chain.robinhood.com', 'https://rpc.ordofi.network'])];

export const CHAIN_ID = 4663;
export const CHAIN_NAME = 'Robinhood Chain';
export const EXPLORER = 'https://robinhoodchain.blockscout.com';

/** Robinhood Chain produces a block roughly every 100ms. */
export const BLOCK_TIME_MS = 100;
export const BLOCKS_PER_DAY = Math.round((24 * 60 * 60 * 1000) / BLOCK_TIME_MS);

/**
 * eth_getLogs on the public RPC times out past ~10M blocks and rejects queries
 * that match more than 10,000 logs. A recipient-filtered query over 1.5M blocks
 * answers in under a second, so history is read in chunks of this size.
 */
export const SCAN_CHUNK = 1_500_000n;
/** How far back the settlement history reaches before "Load older". */
export const INITIAL_SCAN_DAYS = 7;

export type PayoutToken = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  issuer: string;
  /** Pegged 1:1 to USD, so the ZEC quote can be priced against it. */
  usdPegged: boolean;
};

/**
 * Payout assets. Robinhood Chain's documented mainnet stablecoin is USDG
 * (Global Dollar, issued by Paxos). USDC bridged in arrives as USDG, so USDG is
 * what a merchant actually receives.
 */
export const PAYOUT_TOKENS: PayoutToken[] = [
  {
    address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
    symbol: 'USDG',
    name: 'Global Dollar',
    decimals: 6,
    issuer: 'Paxos',
    usdPegged: true,
  },
];

export const DEFAULT_TOKEN = PAYOUT_TOKENS[0];

export function tokenByAddress(address: string): PayoutToken | undefined {
  const a = address.toLowerCase();
  return PAYOUT_TOKENS.find((t) => t.address.toLowerCase() === a);
}

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (address: string) => `${EXPLORER}/address/${address}`;
export const explorerBlock = (block: bigint | number | string) => `${EXPLORER}/block/${block.toString()}`;
