import { AssetMark } from '../ui/AssetMarks';
import { IconArrowUpRight, IconCheck, IconLock } from '../ui/Icons';
import { DEMO, PROCESS } from '../../data/site';
import { formatUsd, formatZec, useZecPrice, zecFor } from '../../lib/zecPrice';

/** A small original drawing per step, sized to sit in the same box each time. */
function StepArt({ n }: { n: string }) {
  const price = useZecPrice();
  const zec = zecFor(DEMO.payoutUsd, price);

  if (n === '01') {
    return (
      <div className="step-art">
        <div className="mock">
          <div className="mock-row">
            <span className="mock-label">Payout</span>
            <span className="checkout-asset">
              <AssetMark symbol="USDC" size={16} />
              USDC
            </span>
          </div>
          <p className="mock-value mock-value--lg">{formatUsd(DEMO.payoutUsd)}</p>
        </div>
        <div className="step-art-rule">
          <span className="num">quote</span>
        </div>
        <div className="mock">
          <div className="mock-row">
            <span className="mock-label">Customer pays ZEC</span>
            <span className="mock-value">15:00</span>
          </div>
          <p className="mock-value mock-value--lg">{zec === null ? '...' : formatZec(zec)}</p>
        </div>
      </div>
    );
  }

  if (n === '02') {
    return (
      <div className="step-art">
        <div className="mock step-art-shield">
          <div className="mock-row">
            <span className="mock-label">Sender</span>
            <span className="mock-value step-art-hidden">••••••••••</span>
          </div>
          <div className="mock-row">
            <span className="mock-label">Amount</span>
            <span className="mock-value step-art-hidden">••••••</span>
          </div>
          <div className="mock-row">
            <span className="mock-label">Memo</span>
            <span className="mock-value step-art-hidden">••••••••</span>
          </div>
          <div className="step-art-seal">
            <IconLock size={13} />
            Encrypted on Zcash
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-art">
      <div className="mock">
        <div className="mock-row">
          <span className="mock-label">Settlement tx</span>
          <span className="chip chip--settle">
            <IconCheck size={11} />
            Confirmed
          </span>
        </div>
        <p className="mock-value">0xf4e8...c91a</p>
        <div className="mock-row">
          <span className="mock-label">Block</span>
          <span className="mock-value">18,442,907</span>
        </div>
        <div className="mock-row">
          <span className="mock-label">Payout</span>
          <span className="mock-value">250.00 USDC</span>
        </div>
      </div>
      <p className="step-art-link">
        View on explorer
        <IconArrowUpRight size={12} />
      </p>
    </div>
  );
}

export function Process() {
  return (
    <section className="section pb-lg" id="how-it-works">
      <div className="container">
        <div className="process-frame">
          <div className="head-center process-head" data-reveal-group>
            <p className="eyebrow reveal">{PROCESS.eyebrow}</p>
            <h2 className="reveal">{PROCESS.heading}</h2>
            <p className="lede reveal">{PROCESS.lede}</p>
          </div>

          <ol className="process-grid" data-reveal-group>
            {PROCESS.steps.map((step) => (
              <li className="process-card reveal" key={step.n}>
                <StepArt n={step.n} />
                <p className="process-tag eyebrow">{step.tag}</p>
                <p className="process-n num">{step.n}</p>
                <h3 className="process-title">{step.title}</h3>
                <p className="body-copy">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
