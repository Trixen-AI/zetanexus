# ZetaNexus

Private ZEC in. Onchain settlement out.

A marketing site for a shielded-ZEC checkout that settles merchant payouts on Robinhood Chain.
Built as React + Vite + TypeScript.

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
(`POST /api/checkouts`). Set `VITE_ZETANEXUS_API_URL` and new checkouts carry one; until then the
dashboard says so and never generates an address in the browser. Checkouts are stored per wallet
in the browser (versioned, exportable in Settings) because there is no server-side store yet.

**Environment** (`.env`, see `.env.example`): `VITE_REOWN_PROJECT_ID` (required for wallets),
`VITE_ZETANEXUS_API_URL` (optional), `VITE_RHC_RPC_URL` (optional). Reads fail over to a second
public RPC when the official one returns a malformed CORS header.

**Hosting:** client-side routes need an SPA fallback (every path serves `index.html`).

## Design direction

Technical payment terminal, not a crypto-gradient landing page. Hairline rules, monospace
labels, tabular figures, generous whitespace, and one animated field that carries the whole
idea: **shielded on the left, settled on the right.**

- **Ink** `#0d0f12` on **paper** `#fafaf9`
- **Shield violet** `#6e56f8` for everything private (the ZEC leg)
- **Settle green** `#12c97e` for everything public (the Robinhood Chain leg)
- **Signal amber** `#ffb020` for expiry and pending states
- **Space Grotesk** for display and UI, **JetBrains Mono** for labels, figures and code

The two accents are not decoration. Anything violet is information the payment keeps; anything
green is information the payment publishes. The hero canvas, the privacy carousel, the settlement
diagram and the logo all use that one rule.

## The logo

The mark is a "Z" (Zeta, and Zcash) whose
diagonal is replaced by a junction box: a dashed violet rail comes in along the top edge (the
shielded ZEC leg), a solid rail leaves along the bottom edge (the public payout on Robinhood
Chain), and the green core is the settlement receipt.

`npm run logo` regenerates every output from one source:

- `public/brand/logo.svg` and `logo-dark.svg` (wordmark outlined from Space Grotesk 500)
- `public/brand/logo-500.png` (500x500 on the brand background)
- `public/brand/logo-500-transparent.png` (500x500, transparent)
- `public/brand/logo-mark-500.png` and `logo-mark.svg` (mark only, 500x500 on the brand background, for the X avatar)
- `public/brand/favicon.svg` (zoomed junction, solid stubs so it survives 16px)
- `src/brand/logo-paths.ts` (consumed by the inline React logo, sized in CSS)

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

The only social link is X, `https://x.com/ZetaNexus_` (`FOOTER.community` in `src/data/site.ts`).
Examples and form placeholders use the main domain, `z2r-nexus.com`.

The access form in `src/components/sections/Access.tsx` has no backend. It confirms locally.
Point it at a real endpoint before shipping.

## Notes

- The ZEC price is real (see above). Everything else on the page, addresses, hashes, receipts,
  the volume stat and the payloads, is illustrative. The only network calls are the two
  read-only price endpoints, and no funds move.
- The checkout demo advances on a timer only while it is on screen, and holds still under
  `prefers-reduced-motion`.
- The hero canvas pauses when scrolled out of view.
