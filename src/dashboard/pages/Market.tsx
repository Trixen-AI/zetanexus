import { useState } from 'react';
import { parseUnits, type Address } from 'viem';
import { PageHead, PanelHead, KV, TxLink, AddressLink } from '../ui';
import { CATALOG, type Plan, type Product } from '../../data/catalog';
import { CONTRACTS, ZZEC } from '../../data/site';
import { DEFAULT_TOKEN } from '../config';
import { useApproval } from '../lib/approve';
import { fmtToken } from '../lib/format';
import { PRODUCT_ART } from '../../components/ui/ProductArt';
import { formatUsd, useZecPrice } from '../../lib/zecPrice';

type PayAsset = 'zzec' | 'usdg';
const MARKET = CONTRACTS.market.trim();
const SPENDER = (/^0x[0-9a-fA-F]{40}$/.test(MARKET) ? MARKET : '') as Address | '';

const ASSETS: Record<PayAsset, { label: string; address: Address; decimals: number; note: string }> = {
  zzec: { label: 'zZEC', address: ZZEC.token as Address, decimals: ZZEC.decimals, note: 'Priced at the live ZEC rate' },
  usdg: { label: DEFAULT_TOKEN.symbol, address: DEFAULT_TOKEN.address, decimals: DEFAULT_TOKEN.decimals, note: '1 USDG = 1 USD' },
};

function Checkout({ product, plan }: { product: Product; plan: Plan }) {
  const price = useZecPrice();
  const [asset, setAsset] = useState<PayAsset>('zzec');
  const a = ASSETS[asset];

  // amount in the pay asset, rounded up so the order is never underpaid
  let amountStr: string | null = null;
  if (asset === 'usdg') amountStr = plan.usd.toFixed(2);
  else if (price.usd) amountStr = (Math.ceil((plan.usd / price.usd) * 1e8) / 1e8).toFixed(8);
  const units = amountStr ? parseUnits(amountStr, a.decimals) : 0n;
  const ap = useApproval(a.address, SPENDER, units);

  const label =
    ap.stage === 'switch'
      ? 'Switch to Robinhood Chain'
      : ap.stage === 'signing'
        ? 'Confirm in your wallet...'
        : ap.stage === 'pending'
          ? 'Approving...'
          : ap.alreadyApproved || ap.stage === 'done'
            ? 'Approved'
            : `Approve ${amountStr ?? '...'} ${a.label}`;

  return (
    <aside className="dash-panel mkt-checkout">
      <PanelHead eyebrow="Order" title={`${product.name} · ${plan.label}`} />
      <p className="dash-muted">{plan.detail}</p>

      <fieldset className="dash-field">
        <legend className="access-label">Pay with</legend>
        <div className="dash-segment">
          {(Object.keys(ASSETS) as PayAsset[]).map((k) => (
            <button
              key={k}
              type="button"
              className={`dash-segment-btn${asset === k ? ' is-active' : ''}`}
              aria-pressed={asset === k}
              onClick={() => {
                setAsset(k);
                ap.reset();
              }}
            >
              {ASSETS[k].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="dash-kvs">
        <KV k="Price">
          <span className="num">${formatUsd(plan.usd)}</span>
        </KV>
        <KV k="You pay">
          <span className="num">
            {amountStr ?? '...'} {a.label}
          </span>
        </KV>
        <KV k="Rate">
          <span className="num">{asset === 'zzec' ? (price.usd ? `1 ZEC = $${formatUsd(price.usd)}` : '...') : a.note}</span>
        </KV>
        <KV k="Your balance">
          <span className={`num${ap.balanceLoaded && !ap.enough ? ' dash-down' : ''}`}>
            {ap.balanceLoaded ? fmtToken(ap.balance, a.decimals, true) : '...'} {a.label}
          </span>
        </KV>
        {SPENDER ? (
          <KV k="Spender">
            <AddressLink address={SPENDER} />
          </KV>
        ) : null}
      </div>

      {ap.balanceLoaded && !ap.enough ? <p className="dash-field-error">This wallet holds less {a.label} than the order needs.</p> : null}

      <div className="dash-actions">
        <button
          type="button"
          className="btn btn--brand mkt-approve"
          onClick={ap.approve}
          disabled={!SPENDER || !amountStr || !ap.enough || ap.stage === 'signing' || ap.stage === 'pending' || ap.alreadyApproved}
          title={SPENDER ? undefined : 'Available once the market contract address is set'}
        >
          {label}
        </button>
        {ap.txHash ? <TxLink hash={ap.txHash} /> : null}
      </div>
      {ap.stage === 'error' && ap.error ? <p className="dash-alert">{ap.error}</p> : null}
    </aside>
  );
}

/**
 * The market: pick a product and plan, choose zZEC or USDG, and approve the
 * amount from the connected wallet. Balances and the ZEC rate are live; the
 * approval goes to the market contract set in src/data/site.ts (CONTRACTS.market).
 */
export function Market() {
  const [productKind, setProductKind] = useState(CATALOG[0].kind);
  const product = CATALOG.find((p) => p.kind === productKind) ?? CATALOG[0];
  const [planId, setPlanId] = useState(product.plans[1]?.id ?? product.plans[0].id);
  const plan = product.plans.find((p) => p.id === planId) ?? product.plans[0];
  const price = useZecPrice();

  return (
    <>
      <PageHead index="06" title="Market" lede="Data, AI credit, servers and network services, priced in dollars and paid from your wallet in zZEC or USDG." />

      <div className="mkt-layout">
        <div className="mkt-main">
          <div className="mkt-products" role="tablist" aria-label="Products">
            {CATALOG.map((p) => {
              const Art = PRODUCT_ART[p.kind];
              const active = p.kind === product.kind;
              return (
                <button
                  key={p.kind}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`mkt-product ticket${active ? ' is-active' : ''}`}
                  onClick={() => {
                    setProductKind(p.kind);
                    setPlanId(p.plans[1]?.id ?? p.plans[0].id);
                  }}
                >
                  <span className="mkt-product-art">
                    <Art />
                  </span>
                  <span className="mkt-product-name">{p.name}</span>
                  <span className="mkt-product-from num">from ${Math.min(...p.plans.map((x) => x.usd))}</span>
                </button>
              );
            })}
          </div>

          <section className="dash-panel">
            <PanelHead eyebrow={product.name} title="Choose a plan" />
            <div className="mkt-plans" role="radiogroup" aria-label={`${product.name} plans`}>
              {product.plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === plan.id}
                  className={`mkt-plan${p.id === plan.id ? ' is-active' : ''}`}
                  onClick={() => setPlanId(p.id)}
                >
                  <span className="mkt-plan-label">{p.label}</span>
                  <span className="mkt-plan-detail">{p.detail}</span>
                  <span className="mkt-plan-price num">
                    ${formatUsd(p.usd)}
                    <small>{price.usd ? `${(p.usd / price.usd).toFixed(5)} ZEC` : ''}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <Checkout key={`${product.kind}-${plan.id}`} product={product} plan={plan} />
      </div>
    </>
  );
}
