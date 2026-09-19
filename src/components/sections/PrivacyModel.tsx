import { useEffect, useRef, useState } from 'react';
import { Swiper, Navigation as SwiperNavigation } from 'swiper';
import 'swiper/css';
import { IconArrowLeft, IconArrowRight, IconCheck, IconLock } from '../ui/Icons';
import { PRIVACY, TICKER, type PrivacyTone } from '../../data/site';
import { formatUsd, useZecPrice } from '../../lib/zecPrice';

const TONE_ART: Record<PrivacyTone, { label: string; body: string }> = {
  shield: {
    label: 'Never leaves the shielded pool',
    body: 'The Zcash side of the payment carries no readable sender, amount or memo.',
  },
  settle: {
    label: 'Written to a public block',
    body: 'The payout is an ordinary transaction. Anyone can look it up and check the amount.',
  },
  signal: {
    label: 'Held by a trusted intermediary',
    body: 'The liquidity provider sits between the two legs, so it can link them. This is the trust you are extending.',
  },
};

/** Per-slide artwork: a lock, a receipt block, or a linking bridge. */
function ToneArt({ tone }: { tone: PrivacyTone }) {
  if (tone === 'shield') {
    return (
      <svg className="tone-art" viewBox="0 0 320 320" fill="none" aria-hidden="true">
        <rect x="60" y="60" width="200" height="200" rx="14" stroke="var(--shield)" strokeWidth="1.4" opacity="0.4" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M84 ${104 + i * 28}H236`}
            stroke="var(--shield)"
            strokeWidth="6"
            strokeDasharray="14 12"
            strokeLinecap="butt"
            opacity={0.34 - i * 0.04}
          />
        ))}
        <circle cx="160" cy="160" r="40" fill="var(--shield-wash)" stroke="var(--shield)" strokeWidth="1.4" />
        <g transform="translate(142 142)" color="var(--shield)">
          <IconLock size={36} />
        </g>
      </svg>
    );
  }

  if (tone === 'settle') {
    return (
      <svg className="tone-art" viewBox="0 0 320 320" fill="none" aria-hidden="true">
        <rect x="52" y="76" width="216" height="168" rx="12" fill="var(--settle-wash)" stroke="var(--settle)" strokeWidth="1.4" />
        <path d="M52 116h216" stroke="var(--settle)" strokeWidth="1" opacity="0.5" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="78" y={140 + i * 34} width="78" height="9" rx="2" fill="var(--settle)" opacity="0.32" />
            <rect x={168 + i * 6} y={140 + i * 34} width={74 - i * 6} height="9" rx="2" fill="var(--settle)" opacity="0.6" />
          </g>
        ))}
        <circle cx="240" cy="96" r="11" fill="var(--settle)" />
        <g transform="translate(233 89)" color="#ffffff">
          <IconCheck size={14} />
        </g>
      </svg>
    );
  }

  return (
    <svg className="tone-art" viewBox="0 0 320 320" fill="none" aria-hidden="true">
      <rect x="40" y="118" width="86" height="86" rx="10" stroke="var(--shield)" strokeWidth="1.4" opacity="0.6" />
      <rect x="194" y="118" width="86" height="86" rx="10" stroke="var(--settle)" strokeWidth="1.4" opacity="0.7" />
      <path d="M126 148h68" stroke="var(--signal)" strokeWidth="2" strokeDasharray="6 6" />
      <path d="M126 174h68" stroke="var(--signal)" strokeWidth="2" strokeDasharray="6 6" />
      <circle cx="160" cy="161" r="26" fill="var(--signal-wash)" stroke="var(--signal)" strokeWidth="1.4" />
      <circle cx="160" cy="161" r="6" fill="var(--signal)" />
      <path d="M160 92v30M160 200v30" stroke="var(--signal)" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.7" />
    </svg>
  );
}

export function PrivacyModel() {
  const railRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const price = useZecPrice();

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const swiper = new Swiper(el, {
      modules: [SwiperNavigation],
      slidesPerView: 1,
      spaceBetween: 24,
      navigation: { prevEl: prevRef.current, nextEl: nextRef.current },
      on: { slideChange: (instance: Swiper) => setIndex(instance.activeIndex) },
    });
    return () => swiper.destroy(true, true);
  }, []);

  return (
    <section className="section pb-lg" id="privacy">
      <div className="container">
        <div className="head-center" data-reveal-group>
          <p className="eyebrow reveal">{PRIVACY.eyebrow}</p>
          <h2 className="reveal">{PRIVACY.heading}</h2>
          <p className="lede reveal">{PRIVACY.lede}</p>
        </div>

        <div className="carousel reveal">
          <div className="carousel-bar">
            <button ref={prevRef} type="button" className="carousel-btn" aria-label="Previous">
              <IconArrowLeft />
            </button>
            <ol className="carousel-dots" aria-hidden="true">
              {PRIVACY.columns.map((c, i) => (
                <li key={c.key} className={i === index ? 'is-active' : ''} />
              ))}
            </ol>
            <button ref={nextRef} type="button" className="carousel-btn" aria-label="Next">
              <IconArrowRight />
            </button>
          </div>

          <div className="swiper privacy-rail" ref={railRef}>
            <div className="swiper-wrapper">
              {PRIVACY.columns.map((column) => (
                <article className={`swiper-slide privacy-slide privacy-slide--${column.tone}`} key={column.key}>
                  <div className="privacy-figure">
                    <ToneArt tone={column.tone} />
                  </div>
                  <div className="privacy-copy">
                    <p className={`eyebrow chip chip--${column.tone}`}>{column.subtitle}</p>
                    <h3 className="privacy-title">{column.title}</h3>
                    <p className="body-copy">{TONE_ART[column.tone].body}</p>
                    <ul className="privacy-list">
                      {column.items.map((item) => (
                        <li key={item}>
                          <i className={`dot dot--${column.tone}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="privacy-foot num">{TONE_ART[column.tone].label}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settlement receipts, drifting past. Same construction as a logo marquee,
          but showing this product's own output rather than other people's marks. */}
      <div className="ticker reveal" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <ul className="ticker-list" key={copy}>
              {TICKER.map((row) => (
                <li key={`${copy}-${row.id}`}>
                  <span className="num ticker-id">{row.id}</span>
                  <span className="num ticker-amount">{row.zec.toFixed(5)} ZEC</span>
                  <IconArrowRight size={12} />
                  <span className="num ticker-payout">
                    {price.usd ? `${formatUsd(row.zec * price.usd)} USDC` : '... USDC'}
                  </span>
                  <span className="num ticker-tx">{row.tx}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

    </section>
  );
}
