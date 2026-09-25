# ZKRail

Spend ZEC in the shade. Settle it in the open.

A shielded Zcash economy on Robinhood Chain, built as React + Vite + TypeScript:

- **The market**: eSIM data, AI credit, servers, VPN, proxies and domains, priced in dollars and paid in shielded ZEC.
- **Holder payouts**: part of every $ZKRAIL trading fee is converted to zZEC and pushed to qualifying holders.
- **Merchant checkout**: accept shielded ZEC and settle each order as a public payout on Robinhood Chain.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle into dist/
npm run lint
npm run logo     # regenerate the logo files from scripts/build-logo.mjs
```

## What is here

| Path | Holds |
|---|---|
| `src/data/site.ts` | **All copy and list data.** Edit wording here, not in components. |
| `src/styles/tokens.css` | Palette, type scale, spacing scale, radii, breakpoints. |
| `src/styles/base.css` | Reset, typography defaults, reduced-motion handling. |
| `src/styles/components.css` | Shared devices: container, panel, card, eyebrow, button, chip, data row. |
| `src/styles/sections.css` | Per-section layout and the 992 / 768 / 480 breakpoints. |
| `src/brand/` | `Logo.tsx` (inline lockup) and the generated outlined wordmark paths. |
| `src/components/sections/` | One component per page section. |
| `src/components/ui/` | Icons, asset marks, and the hero canvas field. |
| `scripts/build-logo.mjs` | Builds `public/brand/*` and `src/brand/logo-paths.ts`. |

## Merchant dashboard (`/app`)

The site is a React Router app. `/` is the marketing page; `/app/*` is the merchant dashboard and
`/pay/:token` is the customer payment page. Both are lazy chunks, so wallet code never loads for
someone reading the website.

| Route | What it does |
|---|---|
| `/app` | USDG + ETH balance of the settlement address, 7-day receipts, open checkouts, setup checklist |
| `/app/checkouts` | Every checkout with its status reconciled against the chain; filter, search, CSV export |
| `/app/checkouts/new` | Locks a live ZEC quote for a USDG payout; records the creation block |
| `/app/checkouts/:id` | Quote, countdown, shielded address (from the API), payment link + QR, settlement watcher, privacy view, signed webhook payload |
| `/app/settlements` | Every USDG transfer into the settlement address, read with `eth_getLogs`; manual attach |
| `/app/verify` | Any Robinhood Chain tx: receipt, confirmations, decoded token transfers, attach to a checkout |
| `/app/developers` | API status, request builder, HMAC-SHA256 webhook signer/verifier |
| `/app/settings` | Store name, settlement address, payout asset, webhook URL + secret, ledger backup |

**What is real.** Wallet connection (Reown AppKit + wagmi, Robinhood Chain mainnet, chain 4663),
balances, incoming transfers, block numbers, receipts, the ZEC price, webhook signatures.
A checkout settles when a transfer of exactly its payout amount reaches the settlement address
at or after the block it was created in; older checkouts claim first, each transfer settles one
checkout, and payouts from before a checkout existed are never attached to it.

**Payout asset is USDG**, not USDC: it is the stablecoin Robinhood Chain documents on mainnet
(`0x5fc5...d168`, 6 decimals, verified on-chain).

**What needs a backend.** Shielded ZEC addresses come from the liquidity-provider API
(`POST /api/checkouts`). Set `VITE_ZKRAIL_API_URL` and new checkouts carry one; until then the
dashboard says so and never generates an address in the browser. Checkouts are stored per wallet
in the browser (versioned, exportable in Settings) because there is no server-side store yet.

**Environment** (`.env`, see `.env.example`): `VITE_REOWN_PROJECT_ID` (required for wallets),
`VITE_ZKRAIL_API_URL` (optional), `VITE_RHC_RPC_URL` (optional). Reads fail over to a second
public RPC when the official one returns a malformed CORS header.

**Hosting:** client-side routes need an SPA fallback (every path serves `index.html`).

## Design direction

The zama.org palette: a white page with warm grey bands and tiles, black type, and black islands
(the integration band, code blocks) set into it. Square-cut ticket panels and registration marks
around the viewport.

- **White** `#ffffff` ground, **warm grey** `#f2efec` tiles, **black** `#000000` type, greys `#e8e8e8` / `#d9d9d9` for lines
- **Zama yellow** `#ffd209` for everything settled in public and for primary actions (type uses `#7d6000`)
- **Near-black** `#2e2e2e` for everything shielded (the private leg, "in the shade")
- **Zama orange** `#ffb243` for payouts and time (type uses `#9a5500`)
- **Bricolage Grotesque** for display and UI, **Martian Mono** for labels, figures and code

Frame devices, all in `src/styles/components.css`: `.frame` (viewport registration marks),
`.ticket` (notched panel) with `.ticket-tear` (perforation), `.section-index` ("02 / EARN").

## What is live, what waits for launch

| Piece | Source | Status |
|---|---|---|
| ZEC price | CoinGecko, Coinbase fallback | Live |
| zZEC backing | ZEAL reserve API + zZEC `totalSupply` on chain | Live |
| zZEC balances, payouts, redeem approval | Robinhood Chain + ZEAL redemption desk | Live |
| $ZKRAIL CA row | `CONTRACTS.token` in `src/data/site.ts` | Hidden until the address is set |
| "Never" checks (mint, blacklist, pause, upgrade, fee, team tokens) | $ZKRAIL bytecode, curve and deployer balance | Run automatically once the token address is set |
| Market approval | `CONTRACTS.market` | Approve button enables once the address is set |
| Shielded checkout addresses | `VITE_ZKRAIL_API_URL` | Issued by the checkout API when set |

zZEC is issued by ZEAL, an independent project (github.com/zealtoken/zealtoken). Token
`0x0b151Ff7a7c5250130EC16C275790961d558E402`, 8 decimals. Redemption desk
`0x9A1f622C2267fCdBD664D259A27b057B53E9cA1a` (minimum 0.001 zZEC).

## The logo

A rail leaving a tunnel, on a Zama-yellow tile. The black portal is the shade, where the ZEC
payment travels shielded; one yellow lamp inside shows something is moving there without showing
what. The track runs out of the portal into the daylight of the tile: the leg that settles in the
open. The mark keeps its yellow and black on any background.

`npm run logo` regenerates every output from one source (fonts in `scripts/fonts/`, OFL):

- `public/brand/logo.svg` (on white), `logo-light.svg` (transparent, black word) and `logo-dark.svg` (transparent, white word)
- `public/brand/logo-500.png`, `logo-500-transparent.png` (500x500)
- `public/brand/logo-mark.svg`, `logo-mark-500.png` (mark only, for the X avatar)
- `public/brand/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`
- `public/brand/og-image.png` (1200x630 share card)
- `src/brand/logo-paths.ts` (outlined wordmark for the inline React logo)

## Live ZEC price

`src/lib/zecPrice.ts` is one shared store polled every 60s (only while the tab is visible):
CoinGecko first, Coinbase spot as fallback, both CORS-open. The checkout, the process quote,
the features quote panel, the API response example, the receipts ticker and the hero ZEC chip
all read from it. Payout is fixed at 250.00 USDC (`DEMO.payoutUsd` in `src/data/site.ts`);
the ZEC side is `payout / live price`. If both sources fail the UI says so instead of
showing a made-up number.

## Third-party marks

`src/components/ui/AssetMarks.tsx` inlines three official brand SVGs, unmodified and resized only.
They identify the assets a payment touches. The Zcash brandmark's viewBox is cropped to its circle (the file has 25% empty margin per side); shapes are untouched. They are **not** a partnership or endorsement claim.

| Mark | Source |
|---|---|
| Zcash | `https://z.cash/press/` &rarr; `/wp-content/uploads/2023/11/Brandmark-Black.svg` |
| USDC | `https://www.circle.com/brand` &rarr; `brandkit/logo-downloads/usdc.zip`, `Token Logo/USDC Token.svg` |
| Robinhood Chain | `https://robinhood.com/us/en/chain/`, the inline `<svg aria-label="Robinhood Chain Logo">`. White is the only variant published there, so it always sits on a dark chip rather than being recoloured. |

## Links and domain

Main domain: `https://zkrail-protocol.com`. The only social link is X, `https://x.com/ZKRail_`
(`FOOTER.community` in `src/data/site.ts`). Checkout and webhook examples use `your-store.com`,
because they stand for the merchant's own server.

The merchant access form (in `src/components/sections/Final.tsx`) has no backend. It confirms
locally. Point it at a real endpoint before shipping.

## Notes

- The ZEC price is real (see above). Everything else on the page, addresses, hashes, receipts,
  the volume stat and the payloads, is illustrative. The only network calls are the two
  read-only price endpoints, and no funds move.
- The checkout demo advances on a timer only while it is on screen, and holds still under
  `prefers-reduced-motion`.
- The hero canvas pauses when scrolled out of view.

## Deploy on Vercel

`vercel.json` holds the whole setup: Vite build into `dist/`, SPA fallback (every path serves
`index.html`, so `/app` and `/pay/...` survive a refresh), security headers, one-year caching for
hashed assets, and `noindex` on `/app` and `/pay`. Hashed build files live under `/static`. Node 22 is pinned in `package.json`.

The www/apex redirect lives only in Vercel's Domains settings, never in `vercel.json`: two
redirects pointing at each other loop every `/assets` request and the app never loads.

1. Vercel > Add New > Project > import `Trixen-AI/zetanexus`. Framework, build command and output
   directory are read from `vercel.json`.
2. Add the environment variables below (Production, and Preview if you use it), then deploy.
3. Settings > Domains: add `zkrail-protocol.com` and `www.zkrail-protocol.com`, then point DNS as Vercel shows. Make
   `zkrail-protocol.com` the primary (Edit `www.zkrail-protocol.com` > Redirect to `zkrail-protocol.com`) so it matches the canonical URL.
4. In https://dashboard.reown.com, add `zkrail-protocol.com`, `www.zkrail-protocol.com` (and your `*.vercel.app` preview domain) to the
   project's allowed domains, or the wallet modal is refused in production.

## Environment

Set in Vercel (Project > Settings > Environment Variables) or `.env` locally. They are read at
build time, so redeploy after changing any of them.

| Variable | Required | Purpose |
|---|---|---|
| `VITE_REOWN_PROJECT_ID` | yes | Wallet connect modal (Reown AppKit) |
| `VITE_ZKRAIL_API_URL` | when ready | Checkout API that issues shielded ZEC addresses |
| `VITE_RHC_RPC_URL` | no | Robinhood Chain RPC override (defaults to the public endpoint) |

Contract addresses are not environment variables: paste them into `CONTRACTS` in
`src/data/site.ts` (`token`, `distributor`, `market`) and redeploy.
