import type { MarketKind } from './site';

/**
 * The market catalogue shown in the dashboard. Starter plans and dollar prices:
 * set them to your supplier's real prices before launch. Every ZEC / zZEC / USDG
 * amount in the checkout is derived from these dollar prices and the live rate.
 */
export type Plan = { id: string; label: string; detail: string; usd: number };
export type Product = { kind: MarketKind; name: string; plans: Plan[] };

export const CATALOG: Product[] = [
  {
    kind: 'esim',
    name: 'eSIM',
    plans: [
      { id: 'esim-3', label: '3 GB', detail: '7 days, one country', usd: 6 },
      { id: 'esim-10', label: '10 GB', detail: '30 days, one country', usd: 15 },
      { id: 'esim-20r', label: '20 GB', detail: '30 days, regional', usd: 29 },
    ],
  },
  {
    kind: 'ai',
    name: 'AI credit',
    plans: [
      { id: 'ai-10', label: '$10 credit', detail: 'One key, all major providers', usd: 10 },
      { id: 'ai-25', label: '$25 credit', detail: 'One key, all major providers', usd: 25 },
      { id: 'ai-100', label: '$100 credit', detail: 'One key, all major providers', usd: 100 },
    ],
  },
  {
    kind: 'server',
    name: 'Servers',
    plans: [
      { id: 'vps-1', label: '1 vCPU / 2 GB', detail: 'Linux, root over SSH, 1 month', usd: 8 },
      { id: 'vps-2', label: '2 vCPU / 4 GB', detail: 'Linux, root over SSH, 1 month', usd: 16 },
      { id: 'vps-4', label: '4 vCPU / 8 GB', detail: 'Linux, root over SSH, 1 month', usd: 32 },
    ],
  },
  {
    kind: 'vpn',
    name: 'VPN',
    plans: [
      { id: 'vpn-1m', label: '1 month', detail: 'WireGuard, no logs', usd: 5 },
      { id: 'vpn-6m', label: '6 months', detail: 'WireGuard, no logs', usd: 25 },
      { id: 'vpn-12m', label: '12 months', detail: 'WireGuard, no logs', usd: 45 },
    ],
  },
  {
    kind: 'proxy',
    name: 'Proxy',
    plans: [
      { id: 'px-dc-10', label: '10 GB datacentre', detail: 'Rotating exits', usd: 7 },
      { id: 'px-res-5', label: '5 GB residential', detail: 'Rotating exits', usd: 20 },
      { id: 'px-res-20', label: '20 GB residential', detail: 'Rotating exits', usd: 70 },
    ],
  },
  {
    kind: 'domain',
    name: 'Domain',
    plans: [
      { id: 'dom-xyz', label: '.xyz, 1 year', detail: 'Private registration', usd: 3 },
      { id: 'dom-com', label: '.com, 1 year', detail: 'Private registration', usd: 14 },
      { id: 'dom-io', label: '.io, 1 year', detail: 'Private registration', usd: 45 },
    ],
  },
];
