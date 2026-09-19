import { useEffect, useRef, useState } from 'react';
import { Swiper, type SwiperOptions } from 'swiper';
import 'swiper/css';
import { IconQuote, IconShieldedAddress, IconStates, IconWebhook } from '../ui/Icons';
import { DEMO, FEATURES, WEBHOOK_SAMPLE, type FeatureKind } from '../../data/site';
import { formatUsd, formatZec, useZecPrice, zecFor } from '../../lib/zecPrice';

const ICONS: Record<FeatureKind, typeof IconQuote> = {
  address: IconShieldedAddress,
  quote: IconQuote,
  webhook: IconWebhook,
  states: IconStates,
};

function QuotePanel() {
  const price = useZecPrice();
  const zec = zecFor(DEMO.payoutUsd, price);
  return (
    <div className="mock">
      <div className="mock-row">
        <span className="mock-label">ZEC amount</span>
        <span className="mock-value">{zec === null ? '...' : formatZec(zec)}</span>
      </div>
      <div className="mock-row">
        <span className="mock-label">Rate</span>
        <span className="mock-value">{price.usd ? `1 ZEC = ${formatUsd(price.usd)}` : '...'}</span>
      </div>
      <div className="mock-row">
        <span className="mock-label">Payout</span>
        <span className="mock-value">{formatUsd(DEMO.payoutUsd)} USDC</span>
      </div>
      <div className="mock-row">
        <span className="mock-label">Expires</span>
        <span className="chip chip--signal">14:32</span>
      </div>
    </div>
  );
}

function FeaturePanel({ kind }: { kind: FeatureKind }) {
  if (kind === 'address') {
    return (
      <div className="mock">
        <div className="mock-row">
          <span className="mock-label">Checkout address</span>
          <span className="chip chip--shield">New</span>
        </div>
        <p className="mock-value">zs1q7c8...f4x9</p>
        <div className="mock-row">
          <span className="mock-label">Type</span>
          <span className="mock-value">Sapling shielded</span>
        </div>
        <div className="mock-row">
          <span className="mock-label">Scope</span>
          <span className="mock-value">Single use</span>
        </div>
      </div>
    );
  }

  if (kind === 'quote') return <QuotePanel />;

  if (kind === 'webhook') {
    return (
      <pre className="mock mock--code">
        <code>{WEBHOOK_SAMPLE}</code>
      </pre>
    );
  }

  return (
    <div className="mock">
      <ol className="state-flow">
        <li className="num">awaiting_payment</li>
        <li className="num">confirming</li>
        <li className="num">funded</li>
        <li className="num is-active">settled</li>
      </ol>
      <ul className="state-terminal">
        <li className="num">expired</li>
        <li className="num">partial</li>
        <li className="num">failed</li>
      </ul>
    </div>
  );
}

const RAIL_QUERY = '(max-width: 991px)';

export function Features() {
  const railRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<Swiper | null>(null);
  // Below 992px the four-up grid becomes a swipeable rail. Swiper's own CSS sets
  // .swiper-wrapper to flex and .swiper-slide to full width, so those class names
  // are only ever on the DOM while the rail is actually active.
  const [isRail, setIsRail] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(RAIL_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(RAIL_QUERY);
    const onChange = () => setIsRail(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    if (!isRail) {
      swiperRef.current?.destroy(true, true);
      swiperRef.current = null;
      return;
    }

    const options: SwiperOptions = {
      slidesPerView: 1.08,
      spaceBetween: 16,
      breakpoints: { 640: { slidesPerView: 2.05, spaceBetween: 20 } },
    };
    swiperRef.current = new Swiper(el, options);

    return () => {
      swiperRef.current?.destroy(true, true);
      swiperRef.current = null;
    };
  }, [isRail]);

  return (
    <section className="section pb-lg" id="features">
      <div className="container">
        <div className="features-head" data-reveal-group>
          <p className="eyebrow reveal">{FEATURES.eyebrow}</p>
          <h2 className="reveal">{FEATURES.heading}</h2>
          <p className="lede reveal">{FEATURES.lede}</p>
        </div>
      </div>

      <div className="container">
        <div className={`features-rail${isRail ? ' swiper' : ''}`} ref={railRef}>
          <ul className={`features-grid${isRail ? ' swiper-wrapper' : ''}`} data-reveal-group>
            {FEATURES.items.map((item) => {
              const Icon = ICONS[item.kind];
              return (
                <li
                  className={`feature-card card reveal${isRail ? ' swiper-slide' : ''}`}
                  key={item.title}
                >
                  <span className="feature-icon">
                    <Icon />
                  </span>
                  <h3 className="feature-title">{item.title}</h3>
                  <p className="body-copy feature-body">{item.body}</p>
                  <FeaturePanel kind={item.kind} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
