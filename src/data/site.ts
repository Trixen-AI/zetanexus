/** All ZRail copy and list data. One place, so wording is edited once. */

export const BRAND = {
  name: 'ZRail',
  tagline: 'Spend in the shade. Settle in the open. Earn it back in zZEC.',
  description:
    'ZRail is one shielded Zcash rail on Robinhood Chain: a private market, merchant checkout that settles in public, and zZEC payouts for $ZRAIL holders.',
};

/**
 * Contract addresses. Paste each one here when it is deployed; everything that
 * depends on it (the CA row, the live contract checks, dashboard approvals)
 * switches on by itself. Empty strings keep those parts out of the page.
 */
export const CONTRACTS = {
  /** $ZRAIL token on Robinhood Chain. */
  token: '',
  /** zZEC distributor that pays holders. */
  distributor: '',
  /** Market payment contract that receives approved zZEC / USDG for orders. */
  market: '',
};

const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

export const TOKEN = {
  symbol: 'ZRAIL',
  contract: isAddress(CONTRACTS.token) ? CONTRACTS.token : '',
  explorerBase: 'https://robinhoodchain.blockscout.com/token/',
};

/** The demo merchant used in every checkout example on the page. */
export const DEMO = {
  merchant: 'ZRail Demo Store',
  order: 'ZR-ORD-0042',
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
    label: 'Spend',
    href: '#spend',
    items: [
      { label: 'The market', blurb: 'eSIM, AI credit, servers and more', href: '#spend' },
      { label: 'Open the market', blurb: 'Pay with shielded ZEC', href: '/app/market' },
      { label: 'Privacy model', blurb: 'What stays private', href: '#trust' },
    ],
  },
  {
    index: '02',
    label: 'Settle',
    href: '#settle',
    items: [
      { label: 'Checkout demo', blurb: 'Shielded in, public receipt out', href: '#settle' },
      { label: 'Checkout API', blurb: 'One POST, one shielded address', href: '#integration' },
      { label: 'Merchant dashboard', blurb: 'Quotes, settlements, webhooks', href: '/app' },
    ],
  },
  {
    index: '03',
    label: 'Earn',
    href: '#earn',
    items: [
      { label: 'Holder payouts', blurb: 'Fees returned as zZEC', href: '#earn' },
      { label: 'zZEC backing', blurb: 'Read live from the reserve', href: '#trust' },
      { label: 'Your wallet', blurb: 'Balance, payouts, redeem', href: '/app/earn' },
    ],
  },
];

export const HERO = {
  eyebrow: 'Shielded Zcash, on Robinhood Chain',
  headingLines: ['Spend in the shade.', 'Settle in the open.', 'Earn it back in zZEC.'],
  lede:
    'ZRail is one shielded Zcash rail. Shoppers pay the market in private ZEC, merchants take ZEC and settle each order as a public receipt, and $ZRAIL holders receive part of the fees as zZEC.',
  primary: { label: 'Open the app', href: '/app' },
  secondary: { label: 'See how it connects', href: '#loop' },
  pillars: [
    { n: '01', key: 'spend', title: 'Spend', body: 'eSIM, AI credit, servers, VPN, proxies and domains, paid in shielded ZEC.' },
    { n: '02', key: 'settle', title: 'Settle', body: 'Take ZEC from customers and settle every order as a public payout.' },
    { n: '03', key: 'earn', title: 'Earn', body: 'Hold $ZRAIL and receive trading fees as zZEC, backed by real ZEC.' },
  ],
};

/** Highlights from all three sides, on the drag rail under the hero. */
export const RAIL = {
  hint: 'Drag the rail',
  items: [
    { n: '01', tag: 'Spend', title: 'Travel data that lands before you do' },
    { n: '02', tag: 'Spend', title: 'Model credit for every major provider' },
    { n: '03', tag: 'Settle', title: 'A fresh shielded address for every order' },
    { n: '04', tag: 'Settle', title: 'Quotes locked for fifteen minutes' },
    { n: '05', tag: 'Settle', title: 'A payout hash on the block explorer' },
    { n: '06', tag: 'Earn', title: 'Trading fees returned as zZEC' },
    { n: '07', tag: 'Earn', title: 'zZEC redeemable for native ZEC' },
    { n: '08', tag: 'Privacy', title: 'No profile, no email, no custody' },
  ],
};

/* ==========================================================================
   Three flows, one section: shoppers, merchants, holders.
   ========================================================================== */

export type MarketKind = 'esim' | 'ai' | 'server' | 'vpn' | 'proxy' | 'domain';

export const MARKET = {
  products: [
    { kind: 'esim' as MarketKind, tag: 'Roam', name: 'eSIM', body: 'A data plan for wherever you land. Point your camera at the code and it sets itself up.' },
    { kind: 'ai' as MarketKind, tag: 'Tokens', name: 'AI credit', body: 'Load credit once and spend it across the big model providers from a single key.' },
    { kind: 'server' as MarketKind, tag: 'Root', name: 'Servers', body: 'Monthly Linux machines you reach over SSH. Pay for the month, walk away when it ends.' },
    { kind: 'vpn' as MarketKind, tag: 'Route', name: 'VPN', body: 'Your traffic leaves through a tunnel with no customer record behind it.' },
    { kind: 'proxy' as MarketKind, tag: 'Exit', name: 'Proxy', body: 'Exit addresses from homes or data centres, metered by the gigabyte you use.' },
    { kind: 'domain' as MarketKind, tag: 'DNS', name: 'Domain', body: 'Register a name and point its records anywhere. The public record carries none of your details.' },
  ],
};

export const WHY = {
  items: [
    { title: 'No profile to lose', body: 'A recovery phrase kept in your browser is the whole account.' },
    { title: 'Shade by default', body: 'Purchases draw on a shielded ZEC balance, so nothing public links you to your basket.' },
    { title: 'Bring any of three coins', body: 'ZEC directly, or ETH and zZEC on Robinhood Chain, converted on the way in.' },
  ],
};

export const FLOWS = {
  eyebrow: 'One rail, three ways in',
  heading: 'Pick your side of the counter.',
  lede: 'The same shielded ZEC moves through all three. Choose the one you came for.',
  tabs: [
    { key: 'spend', label: 'Spend', who: 'For shoppers' },
    { key: 'settle', label: 'Settle', who: 'For merchants' },
    { key: 'earn', label: 'Earn', who: 'For holders' },
  ] as const,
  earnSteps: [
    { n: '01', title: 'Fee', tag: '', body: 'A cut of each $ZRAIL buy and sell is set aside.' },
    { n: '02', title: 'Convert', tag: '', body: 'That cut is swapped into zZEC and parked in the distributor.' },
    { n: '03', title: 'Share', tag: 'Automatic', body: 'Qualifying wallets get a slice sized to their holding.' },
    { n: '04', title: 'Send', tag: 'One way', body: 'Slices go out once they outweigh the gas it costs to deliver them.' },
  ],
};

export type FlowKey = (typeof FLOWS.tabs)[number]['key'];

export const RULE = {
  terms: [
    { value: '$100', label: 'Holding needed', note: 'Kept for 15 minutes before the wallet qualifies' },
    { value: '≤5%', label: 'Delivery cost cap', note: 'Of each payout, spent on gas' },
  ],
};

export const CHECKOUT = {
  address: 'zs1q7c8f0m4v2w9k3n6h1r8t5y2u7i4o9p3a6s0d5f4x9',
  addressShort: 'zs1q7c8...f4x9',
  txHash: '0xf4e8...c91a',
  block: '18,442,907',
};

/* ==========================================================================
   The loop: how the three sides feed each other.
   ========================================================================== */

export const LOOP = {
  eyebrow: 'The loop',
  heading: 'Every payment feeds the same loop.',
  steps: [
    { n: '01', tone: 'shield' as const, title: 'Pay in the shade', body: 'A shopper or a customer sends shielded ZEC. Sender, amount and memo stay encrypted on Zcash.' },
    { n: '02', tone: 'settle' as const, title: 'Settle in the open', body: 'The payout lands on Robinhood Chain as an ordinary transaction anyone can look up.' },
    { n: '03', tone: 'signal' as const, title: 'Fees become zZEC', body: 'Trading fees on $ZRAIL are swapped into zZEC and handed to the distributor.' },
    { n: '04', tone: 'shield' as const, title: 'Back to holders', body: 'Holders receive zZEC, redeem it for ZEC or spend it at the market, and the loop starts again.' },
  ],
};

/* ==========================================================================
   Trust: backing, privacy, and what the token can never do.
   ========================================================================== */

/** zZEC is issued by ZEAL, a separate project. Addresses from github.com/zealtoken/zealtoken, checked on-chain. */
export const ZZEC = {
  token: '0x0b151Ff7a7c5250130EC16C275790961d558E402',
  decimals: 8,
  /** ZEAL redemption desk: requestRedeem(amount, zcashAddress) after an approve. Minimum 0.001 zZEC. */
  redemptionDesk: '0x9A1f622C2267fCdBD664D259A27b057B53E9cA1a',
  reserveApi: 'https://zealtoken.com/api/reserve',
  site: 'https://zealtoken.com',
};

export type PrivacyTone = 'shield' | 'settle' | 'signal';

export const PRIVACY = {
  columns: [
    {
      key: 'shielded',
      title: 'Shielded',
      tone: 'shield' as PrivacyTone,
      items: ['Sender wallet address', 'ZEC amount, on Zcash', 'Memo field', 'IP address, over Tor or a VPN'],
    },
    {
      key: 'public',
      title: 'Public on Robinhood Chain',
      tone: 'settle' as PrivacyTone,
      items: ['Settlement amount and asset', 'Destination address', 'Transaction hash and block', 'Liquidity provider address'],
    },
    {
      key: 'provider',
      title: 'Provider observes',
      tone: 'signal' as PrivacyTone,
      items: ['Which ZEC payment funded which payout', 'Exchange rate applied', 'Timing and confirmations', 'Merchant identity'],
    },
  ],
};

export const TRUST = {
  eyebrow: 'Check it yourself',
  heading: 'Nothing here needs taking on faith.',
  lede: 'The reserve behind zZEC, what each party can see, and what the $ZRAIL contract is built unable to do.',
  never: ['Mint', 'Blacklist', 'Pause', 'Upgrade', 'Raise the fee', 'Hold team tokens'],
};

/* ==========================================================================
   Merchant API.
   ========================================================================== */

export const INTEGRATION = {
  eyebrow: 'For merchants',
  heading: 'API-first checkout',
  lede: 'One POST creates the quote and returns the shielded address. There is no widget to embed and no wallet to connect.',
  docs: { label: 'Open the dashboard', href: '/app/developers' },
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
  "webhook_url": "https://your-store.com/hooks/zrail"
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
  "expires_at": "2026-09-25T14:47:00Z",
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

/* ==========================================================================
   Final call to action + merchant access form.
   ========================================================================== */

export const CLOSING = {
  line: 'Earn it. Spend it. Keep it quiet.',
  lede: 'Hold $ZRAIL for zZEC, spend shielded ZEC at the market, and let your own customers pay you in ZEC that settles in public.',
};

export const ACCESS = {
  eyebrow: 'For merchants',
  heading: 'Request integration access',
  lede: 'Tell us what you settle and we will open a sandbox key.',
  fields: [
    { name: 'project', label: 'Project name', placeholder: 'Your store', type: 'text' },
    { name: 'email', label: 'Email', placeholder: 'dev@your-store.com', type: 'email' },
    { name: 'website', label: 'Website', placeholder: 'https://your-store.com', type: 'url' },
    { name: 'volume', label: 'Expected monthly volume', placeholder: 'e.g. 500 checkouts', type: 'text' },
  ],
  submit: 'Submit request',
  confirmation: 'Request received. A sandbox key lands in your inbox within one business day.',
};

export const FOOTER = {
  columns: [
    {
      title: 'Spend',
      links: [
        { label: 'The market', href: '#spend' },
        { label: 'Open the market', href: '/app/market' },
        { label: 'Privacy model', href: '#trust' },
      ],
    },
    {
      title: 'Settle',
      links: [
        { label: 'Checkout demo', href: '#settle' },
        { label: 'Checkout API', href: '#integration' },
        { label: 'Merchant dashboard', href: '/app' },
        { label: 'Request access', href: '#access' },
      ],
    },
    {
      title: 'Earn',
      links: [
        { label: 'Holder payouts', href: '#earn' },
        { label: 'zZEC backing', href: '#trust' },
        { label: 'Your wallet', href: '/app/earn' },
      ],
    },
  ],
  community: {
    title: 'Community',
        links: [{ label: 'X', href: 'https://x.com/ZRail_' }],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'How it connects', href: '#loop' },
      { label: 'Contact', href: '#access' },
      { label: 'Brand kit', href: '/brand/logo.svg' },
    ],
  },
};
