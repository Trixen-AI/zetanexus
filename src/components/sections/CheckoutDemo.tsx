import { useEffect, useMemo, useRef, useState } from 'react';
import { AssetMark } from '../ui/AssetMarks';
import { IconArrowRight, IconCheck, IconCopy, IconLock } from '../ui/Icons';
import { CHECKOUT, DEMO } from '../../data/site';
import { formatUsd, formatZec, priceLabel, useZecPrice, zecFor } from '../../lib/zecPrice';

/**
 * The demo checkout. It runs the real sequence a merchant would see, on a timer:
 * awaiting payment -> confirming -> funded -> settled, with the quote counting
 * down while it waits. Nothing here talks to a network.
 */

const STAGES = [
  { key: 'awaiting_payment', label: 'Awaiting payment', tone: 'signal' as const, hold: 5200 },
  { key: 'confirming', label: 'Confirming on Zcash', tone: 'shield' as const, hold: 3600 },
  { key: 'funded', label: 'Shielded leg funded', tone: 'shield' as const, hold: 2600 },
  { key: 'settled', label: 'Settled on Robinhood Chain', tone: 'settle' as const, hold: 7000 },
];

const QUOTE_SECONDS = 15 * 60;

/** A decorative address matrix drawn from the demo address, not a scannable code. */
function AddressMatrix({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    const grid = 21;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const out: boolean[] = [];
    for (let i = 0; i < grid * grid; i += 1) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      out.push((h & 7) > 3);
    }
    // three orientation blocks, as any address matrix has
    const block = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y += 1) {
        for (let x = 0; x < 7; x += 1) {
          const edge = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          out[(oy + y) * grid + (ox + x)] = edge || core;
        }
      }
    };
    block(0, 0);
    block(14, 0);
    block(0, 14);
    return { grid, out };
  }, [seed]);

  return (
    <svg
      className="matrix"
      viewBox={`0 0 ${cells.grid} ${cells.grid}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Decorative representation of the shielded payment address"
    >
      <rect width={cells.grid} height={cells.grid} fill="var(--white)" />
      {cells.out.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i % cells.grid}
            y={Math.floor(i / cells.grid)}
            width="1"
            height="1"
            fill="var(--ink)"
          />
        ) : null,
      )}
    </svg>
  );
}

export function CheckoutDemo() {
  const [stage, setStage] = useState(0);
  const [seconds, setSeconds] = useState(QUOTE_SECONDS - 28);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const price = useZecPrice();
  const zec = zecFor(DEMO.payoutUsd, price);
  const zecText = zec === null ? '...' : `${formatZec(zec)} ZEC`;
  const payoutText = `${formatUsd(DEMO.payoutUsd)} USDC`;
  const rateText = price.usd ? `1 ZEC = ${formatUsd(price.usd)} USDC` : priceLabel(price);

  // Only run the sequence while the panel is on screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setLive(entries[0]?.isIntersecting ?? false), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = window.setTimeout(() => setStage((s) => (s + 1) % STAGES.length), STAGES[stage].hold);
    return () => window.clearTimeout(id);
  }, [stage, live]);

  useEffect(() => {
    if (!live || stage > 1) return;
    const id = window.setInterval(() => setSeconds((s) => (s <= 1 ? QUOTE_SECONDS : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [live, stage]);

  const current = STAGES[stage];
  const settled = stage === STAGES.length - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CHECKOUT.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked, the address is on screen anyway */
    }
  };

  return (
    <section className="section pt-lg pb-lg" id="checkout">
      <div className="container">
        <div className="head-center" data-reveal-group>
          <h2 className="reveal">{CHECKOUT.heading}</h2>
          <p className="lede reveal">{CHECKOUT.lede}</p>
        </div>

        <div className="checkout reveal" ref={wrapRef}>
          <header className="checkout-head">
            <div className="checkout-merchant">
              <span className="checkout-merchant-name">{DEMO.merchant}</span>
              <span className="checkout-order num">{DEMO.order}</span>
            </div>
            <span className={`chip chip--${current.tone} checkout-status`}>
              <i className={`dot${settled ? '' : ' dot--pulse'}`} />
              {current.label}
            </span>
          </header>

          <div className="checkout-body">
            <div className="checkout-pay">
              <div className="checkout-matrix">
                <AddressMatrix seed={CHECKOUT.address} />
                <div className="checkout-matrix-badge">
                  <IconLock size={12} />
                  Shielded
                </div>
              </div>

              <div className="checkout-address">
                <p className="mock-label">Send exactly</p>
                <p className="checkout-amount num">{zecText}</p>
                <p className="checkout-rate num">{rateText}</p>
                <p className={`checkout-feed num is-${price.status}`}>
                  <i className={`dot${price.status === 'live' ? ' dot--pulse' : ''}`} />
                  {priceLabel(price)}
                </p>

                <button type="button" className="checkout-copy" onClick={copy}>
                  <span className="num">{CHECKOUT.addressShort}</span>
                  {copied ? <IconCheck /> : <IconCopy />}
                </button>

                <p className={`checkout-expiry num${stage > 1 ? ' is-done' : ''}`}>
                  {stage > 1 ? 'Quote locked' : `Expires in ${mm}:${ss}`}
                </p>

                <ol className="checkout-steps">
                  <li>
                    <b>01</b>
                    Send the exact ZEC amount to this address from any shielded wallet.
                  </li>
                  <li>
                    <b>02</b>
                    Nothing about the sender, the amount or the memo leaves the shielded pool.
                  </li>
                  <li>
                    <b>03</b>
                    The merchant payout lands on Robinhood Chain and the receipt appears here.
                  </li>
                </ol>
              </div>
            </div>

            <div className="checkout-settle">
              <div className="mock">
                <div className="mock-row">
                  <span className="mock-label">Amount</span>
                  <span className="checkout-asset">
                    <AssetMark symbol="ZEC" size={16} />
                    ZEC
                  </span>
                </div>
                <p className="mock-value mock-value--lg">{zecText}</p>
              </div>

              <div className="checkout-arrow" aria-hidden="true">
                <IconArrowRight size={16} />
              </div>

              <div className="mock">
                <div className="mock-row">
                  <span className="mock-label">Settlement</span>
                  <span className="checkout-asset">
                    <AssetMark symbol="USDC" size={16} />
                    USDC
                  </span>
                </div>
                <p className="mock-value mock-value--lg">{payoutText}</p>
              </div>

              <div className={`checkout-receipt${settled ? ' is-live' : ''}`}>
                <div className="mock-row">
                  <span className="mock-label">Settlement tx</span>
                  <span className="mock-value">{settled ? CHECKOUT.txHash : 'pending'}</span>
                </div>
                <div className="mock-row">
                  <span className="mock-label">Block</span>
                  <span className="mock-value">{settled ? CHECKOUT.block : 'pending'}</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="checkout-foot">
            <ol className="checkout-track">
              {STAGES.map((s, i) => (
                <li key={s.key} className={i <= stage ? 'is-done' : ''}>
                  <i />
                  <span className="num">{s.key}</span>
                </li>
              ))}
            </ol>
            <p className="checkout-note">Preview only. No real funds move in this demo.</p>
          </footer>
        </div>
      </div>
    </section>
  );
}
