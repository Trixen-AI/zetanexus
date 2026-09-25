import { Link } from 'react-router';
import { RailField } from '../ui/RailField';
import { AssetChip, ZcashMark } from '../ui/AssetMarks';
import { ContractRow } from '../ui/ContractRow';
import { IconArrowRight } from '../ui/Icons';
import { HERO } from '../../data/site';
import { formatUsd, useZecPrice } from '../../lib/zecPrice';

function LiveZecChip() {
  const price = useZecPrice();
  const change = price.change24h;
  return (
    <span className="chip chip--asset chip--live" title="Live ZEC/USD price">
      <ZcashMark />
      ZEC
      <span className="chip-price num">{price.usd ? `$${formatUsd(price.usd)}` : '...'}</span>
      {change !== null && (
        <span className={`chip-change num ${change >= 0 ? 'is-up' : 'is-down'}`}>
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      )}
      {price.status === 'live' && <i className="dot dot--pulse chip-live-dot" aria-label="live" />}
    </span>
  );
}

export function Hero() {
  return (
    <section className="section hero" id="top">
      <div className="container hero-container">
        <div className="hero-card">
          <RailField className="hero-field" />

          <div className="hero-content">
            <p className="hero-kicker reveal">
              <span className="hero-kicker-lamp" aria-hidden="true" />
              {HERO.eyebrow}
            </p>

            <h1 className="hero-title reveal">
              {HERO.headingLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>

            <p className="lede hero-lede reveal">{HERO.lede}</p>

            <div className="hero-actions reveal">
              <Link className="btn btn--brand" to={HERO.primary.href}>
                {HERO.primary.label}
                <IconArrowRight size={15} />
              </Link>
              <a className="btn btn--ghost" href={HERO.secondary.href}>
                {HERO.secondary.label}
              </a>
            </div>

            <ul className="hero-assets reveal" aria-label="Assets and networks a payment touches">
              <li>
                <LiveZecChip />
              </li>
              <li>
                <AssetChip symbol="SOL" />
              </li>
              <li>
                <AssetChip symbol="USDC" />
              </li>
            </ul>

            <ContractRow />
          </div>

          {/* the three sides of the rail, each opens its tab below */}
          <ol className="hero-pillars" data-reveal-group>
            {HERO.pillars.map((p) => (
              <li className="reveal" key={p.key}>
                <a href={`#${p.key}`} className={`hero-pillar hero-pillar--${p.key}`}>
                  <span className="hero-pillar-n num">{p.n}</span>
                  <span className="hero-pillar-title">
                    {p.title}
                    <IconArrowRight size={14} />
                  </span>
                  <span className="hero-pillar-body">{p.body}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
