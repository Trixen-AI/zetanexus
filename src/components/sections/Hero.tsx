import { Link } from 'react-router';
import { RailField } from '../ui/RailField';
import { AssetChip, ZcashMark } from '../ui/AssetMarks';
import { IconArrowRight, IconChevronDown } from '../ui/Icons';
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
            <h1 className="hero-title reveal">
              {HERO.headingLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>

            <p className="lede hero-lede reveal">{HERO.lede}</p>

            <div className="hero-actions reveal">
              <Link className="btn btn--ink" to={HERO.primary.href}>
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
                <AssetChip symbol="RHC" />
              </li>
              <li>
                <AssetChip symbol="USDC" />
              </li>
            </ul>
          </div>

          <div className="hero-foot">
            <div className="hero-stats" data-reveal-group>
              {HERO.stats.map((stat) => (
                <div className="hero-stat reveal" key={stat.label}>
                  <p className="hero-stat-label">{stat.label}</p>
                  <p className="hero-stat-value num">{stat.value}</p>
                  {stat.note && <p className="hero-stat-note">{stat.note}</p>}
                </div>
              ))}
            </div>

            <a className="hero-scroll" href="#checkout">
              {HERO.scrollHint}
              <IconChevronDown size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
