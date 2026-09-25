import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FLOWS, MARKET, RULE, WHY, type FlowKey } from '../../data/site';
import { PRODUCT_ART } from '../ui/ProductArt';
import { CheckoutPanel } from './CheckoutDemo';
import { IconArrowRight } from '../ui/Icons';

const KEYS = FLOWS.tabs.map((t) => t.key) as FlowKey[];
const fromHash = (): FlowKey | null => {
  const h = window.location.hash.replace('#', '') as FlowKey;
  return KEYS.includes(h) ? h : null;
};

function SpendPanel() {
  return (
    <div className="flow-panel">
      <ul className="mkt-grid mkt-grid--compact">
        {MARKET.products.map((p) => {
          const Art = PRODUCT_ART[p.kind];
          return (
            <li className="ticket mkt-ticket" key={p.kind}>
              <div className="mkt-ticket-art">
                <span className="mkt-ticket-tag num">{p.tag}</span>
                <Art />
              </div>
              <div className="ticket-tear" aria-hidden="true" />
              <div className="mkt-ticket-body">
                <h3 className="mkt-ticket-name">{p.name}</h3>
                <p className="body-copy">{p.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flow-foot">
        <ul className="flow-why">
          {WHY.items.map((w) => (
            <li key={w.title}>
              <strong>{w.title}.</strong> {w.body}
            </li>
          ))}
        </ul>
        <Link to="/app/market" className="btn btn--brand">
          Open the market
          <IconArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function SettlePanel() {
  return (
    <div className="flow-panel">
      <CheckoutPanel />
      <div className="flow-foot">
        <p className="flow-foot-copy">
          A merchant quotes an order, the customer pays shielded ZEC to a one-time address, and the payout lands on Robinhood Chain
          as a receipt anyone can look up. The panel above runs through that sequence live.
        </p>
        <Link to="/app/checkouts/new" className="btn btn--brand">
          Create a checkout
          <IconArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function EarnPanel() {
  return (
    <div className="flow-panel flow-earn">
      <ol className="earn-steps">
        {FLOWS.earnSteps.map((s) => (
          <li key={s.n}>
            <span className="earn-step-n num">{s.n}</span>
            <div>
              <p className="earn-step-title">
                {s.title}
                {s.tag ? <span className="chip chip--signal">{s.tag}</span> : null}
              </p>
              <p className="body-copy">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flow-earn-side">
        <p className="flow-earn-rule">
          <span className="num">{RULE.terms[0].value}</span> of $ZRAIL puts you on the list.
        </p>
        {RULE.terms.map((t) => (
          <div className="rule-term ticket" key={t.label}>
            <p className="mock-label">{t.label}</p>
            <p className="rule-value num">{t.value}</p>
            <p className="body-copy">{t.note}</p>
          </div>
        ))}
        <Link to="/app/earn" className="btn btn--brand">
          Check your wallet
          <IconArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

const PANELS: Record<FlowKey, () => React.JSX.Element> = { spend: SpendPanel, settle: SettlePanel, earn: EarnPanel };

export function Flows() {
  const [active, setActive] = useState<FlowKey>(() => fromHash() ?? 'spend');
  const ref = useRef<HTMLElement>(null);

  // #spend / #settle / #earn (nav, hero pillars, footer) open their tab and scroll here
  useEffect(() => {
    const onHash = () => {
      const k = fromHash();
      if (!k) return;
      setActive(k);
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Panel = PANELS[active];

  return (
    <section className="section pt-md pb-lg flows" id="flows" ref={ref}>
      {/* anchor targets for the three tabs */}
      <span id="spend" className="flows-anchor" aria-hidden="true" />
      <span id="settle" className="flows-anchor" aria-hidden="true" />
      <span id="earn" className="flows-anchor" aria-hidden="true" />
      <div className="container">
        <p className="section-index reveal">
          <b>01</b> / {FLOWS.eyebrow}
        </p>
        <div className="flows-head" data-reveal-group>
          <h2 className="reveal">{FLOWS.heading}</h2>
          <p className="lede reveal">{FLOWS.lede}</p>
        </div>

        <div className="flows-tabs reveal" role="tablist" aria-label="ZRail flows">
          {FLOWS.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active === t.key}
              aria-controls={`panel-${t.key}`}
              className={`flows-tab flows-tab--${t.key}${active === t.key ? ' is-active' : ''}`}
              onClick={() => {
                setActive(t.key);
                history.replaceState(null, '', `#${t.key}`);
              }}
            >
              <span className="flows-tab-label">{t.label}</span>
              <span className="flows-tab-who num">{t.who}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} key={active} className="flows-body">
          <Panel />
        </div>
      </div>
    </section>
  );
}
