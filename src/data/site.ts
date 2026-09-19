/** All ZetaNexus copy and list data. One place, so wording is edited once. */

export const BRAND = {
  name: 'ZetaNexus',
  tagline: 'Private ZEC in. Onchain settlement out.',
  description:
    'ZetaNexus takes shielded ZEC at checkout and settles the merchant payout on Robinhood Chain.',
};

/** The ZNX token contract on Robinhood Chain (verified on-chain: ZetaNexus / ZNX, 18 decimals). */
export const TOKEN = {
  symbol: 'ZNX',
  contract: '0xa76f958355d82f698e8535e1d8f51482204d2b67',
  explorer: 'https://robinhoodchain.blockscout.com/token/0xa76f958355d82f698e8535e1d8f51482204d2b67',
};

/** The demo merchant used in every example on the page. */
export const DEMO = {
  merchant: 'ZetaNexus Demo Store',
  order: 'ZN-ORD-0042',
  /** Merchant payout per demo checkout, in USDC. The ZEC side is priced live. */
  payoutUsd: 250,
};

export type NavGroup = {
  index: string;
  label: string;
  href: string;
  items: { label: string; blurb: string; href: string }[];
};

export const NAV: NavGroup[] = [
  {
    index: '01',
    label: 'How it works',
    href: '#how-it-works',
    items: [
      { label: 'Create quote', blurb: 'Lock a ZEC price for 15 minutes', href: '#how-it-works' },
      { label: 'Receive ZEC', blurb: 'One shielded address per checkout', href: '#how-it-works' },
      { label: 'Verify settlement', blurb: 'Payout hash on the block explorer', href: '#how-it-works' },
      { label: 'Reconciliation', blurb: 'Late, partial and failed payments', href: '#features' },
    ],
  },
  {
    index: '02',
    label: 'Integration',
    href: '#integration',
    items: [
      { label: 'Checkout API', blurb: 'One POST, one shielded address', href: '#integration' },
      { label: 'Webhooks', blurb: 'Signed settlement events', href: '#features' },
      { label: 'SDKs', blurb: 'Node, Python, Go', href: '#integration' },
      { label: 'Sandbox', blurb: 'Preview mode, no real funds', href: '#checkout' },
    ],
  },
  {
    index: '03',
    label: 'Security',
    href: '#privacy',
    items: [
      { label: 'Privacy model', blurb: 'What is private, what is public', href: '#privacy' },
      { label: 'Provider trust', blurb: 'What the liquidity provider sees', href: '#privacy' },
      { label: 'Key handling', blurb: 'Viewing keys never leave the vault', href: '#privacy' },
      { label: 'Status', blurb: 'Uptime and settlement latency', href: '#privacy' },
    ],
  },
];

export const HERO = {
  headingLines: ['Private ZEC in.', 'Onchain settlement out.'],
  lede:
    'Accept shielded ZEC payments. Settle merchant orders on Robinhood Chain. Your customer keeps the privacy of the Zcash shielded pool, and you keep a settlement hash you can hand to an auditor.',
  primary: { label: 'Open checkout', href: '/app/checkouts/new' },
  secondary: { label: 'View integration', href: '#integration' },
  stats: [
    { label: 'Shielded volume routed', value: '$186.40', note: '' },
    { label: 'Median settlement time', value: '94 seconds', note: 'Quote to payout' },
  ],
  scrollHint: 'Scroll to explore',
};

export const CHECKOUT = {
  heading: 'Try the checkout flow',
  lede:
    'See the full payment experience: shielded ZEC address, QR code, expiry countdown, settlement status, and Robinhood Chain receipt. No real funds required.',
  address: 'zs1q7c8f0m4v2w9k3n6h1r8t5y2u7i4o9p3a6s0d5f4x9',
  addressShort: 'zs1q7c8...f4x9',
  txHash: '0xf4e8...c91a',
  block: '18,442,907',
};

export const PROCESS = {
  eyebrow: 'Process',
  heading: 'Three moves, one receipt',
  lede: 'A checkout starts as a quote, arrives as shielded ZEC, and ends as a public payout.',
  steps: [
    {
      n: '01',
      title: 'Create quote',
      body:
        'The merchant asks for a payout amount and asset. ZetaNexus answers with the live ZEC price, a unique shielded payment address, and a 15 minute expiry window.',
      tag: 'Shielded input',
    },
    {
      n: '02',
      title: 'Receive ZEC',
      body:
        'The customer sends shielded ZEC to that address. Sender, amount, and memo stay encrypted on the Zcash blockchain, so the checkout leaks nothing about who paid.',
      tag: 'Encrypted on-chain',
    },
    {
      n: '03',
      title: 'Verify settlement',
      body:
        'Once the ZEC payment confirms, the liquidity provider executes the payout on Robinhood Chain. That settlement transaction is public and verifiable on the block explorer.',
      tag: 'Public settlement',
    },
  ],
};

export type FeatureKind = 'address' | 'quote' | 'webhook' | 'states';

export const FEATURES = {
  eyebrow: 'Features',
  heading: 'Everything a payment needs after the price is agreed',
  lede:
    'Quotes expire, customers underpay, webhooks get retried. ZetaNexus treats all of that as part of the product rather than an edge case.',
  items: [
    {
      title: 'A shielded address for every checkout',
      body: 'Addresses are single use, so two orders can never be confused for one another.',
      kind: 'address' as FeatureKind,
    },
    {
      title: 'A fixed quote with an explicit expiry',
      body:
        'The ZEC amount and the rate are locked when the quote is issued, then counted down in the open.',
      kind: 'quote' as FeatureKind,
    },
    {
      title: 'A signed webhook and a settlement receipt',
      body: 'Every state change arrives signed, with the settlement hash attached once the payout lands.',
      kind: 'webhook' as FeatureKind,
    },
    {
      title: 'Reconciliation for late, partial and failed payments',
      body: 'Each checkout carries one status. Nothing is left in a state your ledger cannot name.',
      kind: 'states' as FeatureKind,
    },
  ],
};

export const RECONCILE = {
  eyebrow: 'Reconciliation',
  heading: 'One status, whatever the customer does',
  body:
    'A quote can expire before the ZEC lands. A customer can send half. A payout can fail and need a retry. ZetaNexus writes one status per checkout and keeps the history, so your books match the chain without anyone reading a mempool.',
  flow: [
    { state: 'awaiting_payment', note: 'Quote issued, address live', active: false },
    { state: 'confirming', note: 'ZEC seen, waiting on depth', active: false },
    { state: 'funded', note: 'Shielded leg complete', active: false },
    { state: 'settled', note: 'Payout hash on Robinhood Chain', active: true },
  ],
  terminal: [
    { state: 'expired', note: '15 minutes elapsed, no funds' },
    { state: 'partial', note: 'Underpaid, refund address required' },
    { state: 'failed', note: 'Payout reverted, retry queued' },
  ],
};

export const SETTLEMENT = {
  eyebrow: 'Settlement',
  heading: 'The public leg is the part you can prove',
  body:
    'ZetaNexus does not ask you to trust a screenshot. Every payout is an ordinary Robinhood Chain transaction with an amount, a destination, and a block. Paste the hash into an explorer and the merchant side of the payment is fully accounted for.',
};

export const INTEGRATION = {
  eyebrow: 'Integration',
  heading: 'API-first checkout',
  lede:
    'One POST creates the quote and returns the shielded address. There is no widget to embed and no wallet to connect.',
  docs: { label: 'View docs', href: '#integration' },
};

/** The three payloads shown in the code panel. `zec` is the live-priced amount
 *  (8 decimals) or null while the price is still loading. */
export function integrationTabs(zec: string | null) {
  const amount = zec ?? '0.00000000';
  return [
    {
      key: 'request',
      title: 'POST /api/checkouts',
      lang: 'json',
      note: 'Example request. Addresses are not real.',
      code: `{
  "merchant_name": "${DEMO.merchant}",
  "order_ref": "${DEMO.order}",
  "payout_amount": "${DEMO.payoutUsd.toFixed(2)}",
  "payout_asset": "USDC",
  "settlement_address": "0x742d...4e29",
  "webhook_url": "https://z2r-nexus.com/hooks/z2r"
}`,
    },
    {
      key: 'response',
      title: 'Response 201',
      lang: 'json',
      note: 'Example response. zec_amount is priced from the live ZEC rate; the shielded address is generated per checkout.',
      code: `{
  "id": "chk_a1b2c3d4",
  "status": "awaiting_payment",
  "zec_amount": "${amount}",
  "shielded_address": "zs1q7c8...f4x9",
  "expires_at": "2026-09-18T14:47:00Z",
  "payout": {
    "amount": "${DEMO.payoutUsd.toFixed(2)}",
    "asset": "USDC",
    "chain": "robinhood_chain"
  }
}`,
    },
    {
      key: 'webhook',
      title: 'POST your webhook_url',
      lang: 'json',
      note: 'Sent once the payout lands. Verify the signature before trusting the body.',
      code: WEBHOOK_SAMPLE,
    },
  ];
}

export const WEBHOOK_SAMPLE = `{
  "event": "settlement_complete",
  "checkout_id": "chk_a1b2c3",
  "settlement_tx": "0xf4e8...c91a",
  "payout": "250.00 USDC",
  "signature": "sha256=9d1f..."
}`;

export type PrivacyTone = 'shield' | 'settle' | 'signal';

export const PRIVACY = {
  eyebrow: 'Privacy model',
  heading: 'What stays private. What becomes public.',
  lede:
    'ZetaNexus is not a trustless bridge and it is not a private Robinhood transaction. The ZEC payment can be shielded, but the settlement is public. Here is exactly what each party can observe.',
  columns: [
    {
      key: 'shielded',
      title: 'Shielded',
      subtitle: 'Private',
      tone: 'shield' as PrivacyTone,
      items: [
        'Sender wallet address',
        'ZEC payment amount, on Zcash',
        'Transaction memo field',
        'Sender IP address, over Tor or a VPN',
      ],
    },
    {
      key: 'public',
      title: 'Public',
      subtitle: 'On Robinhood Chain',
      tone: 'settle' as PrivacyTone,
      items: [
        'Settlement amount and asset',
        'Merchant destination address',
        'Transaction hash and block',
        'Liquidity provider address',
      ],
    },
    {
      key: 'provider',
      title: 'Provider observes',
      subtitle: 'Trusted intermediary',
      tone: 'signal' as PrivacyTone,
      items: [
        'Correlation between ZEC payment and settlement',
        'Exchange rate applied',
        'Payment timing and confirmation speed',
        'Merchant identity, from the checkout request',
      ],
    },
  ],
};

/** Recent demo receipts. Payouts are computed from the live ZEC price. */
export const TICKER = [
  { id: 'chk_a1b2c3d4', zec: 0.17189, tx: '0xf4e8...c91a' },
  { id: 'chk_9f3e71a0', zec: 0.05614, tx: '0x71bd...4402' },
  { id: 'chk_2c8d05be', zec: 0.43667, tx: '0x0ae3...9d17' },
  { id: 'chk_6b10f24c', zec: 0.01293, tx: '0xcc52...1f8b' },
  { id: 'chk_d4470e19', zec: 0.26402, tx: '0x3f96...b7e5' },
  { id: 'chk_51ea9c72', zec: 0.10534, tx: '0x8d21...f07a' },
];

export const ACCESS = {
  eyebrow: 'Get started',
  heading: 'Request integration access',
  lede: 'Tell us what you are settling and we will open a sandbox key.',
  fields: [
    { name: 'project', label: 'Project name', placeholder: 'ZetaNexus Demo Store', type: 'text' },
    { name: 'email', label: 'Email', placeholder: 'dev@z2r-nexus.com', type: 'email' },
    { name: 'website', label: 'Website', placeholder: 'https://z2r-nexus.com', type: 'url' },
    { name: 'volume', label: 'Expected monthly volume', placeholder: 'e.g. 500 checkouts', type: 'text' },
  ],
  submit: 'Submit request',
  confirmation: 'Request received. A sandbox key lands in your inbox within one business day.',
};

export const FOOTER = {
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Dashboard', href: '/app' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Integration', href: '#integration' },
        { label: 'Security', href: '#privacy' },
        { label: 'Checkout demo', href: '#checkout' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { label: 'API reference', href: '#integration' },
        { label: 'Webhooks', href: '#features' },
        { label: 'SDKs', href: '#integration' },
        { label: 'Sandbox keys', href: '#access' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Status', href: '#privacy' },
        { label: 'Changelog', href: '#integration' },
        { label: 'Privacy model', href: '#privacy' },
        { label: 'Support', href: '#access' },
      ],
    },
  ],
  community: {
    title: 'Community',
    links: [{ label: 'X', href: 'https://x.com/ZetaNexus_' }],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '#how-it-works' },
      { label: 'Contact', href: '#access' },
      { label: 'Brand kit', href: '/brand/logo.svg' },
      { label: 'Legal', href: '#privacy' },
    ],
  },
};
