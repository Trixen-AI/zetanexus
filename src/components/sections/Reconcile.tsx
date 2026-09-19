import { IconArrowRight, IconCheck } from '../ui/Icons';
import { RECONCILE, SETTLEMENT } from '../../data/site';

/**
 * ZetaNexus's own settlement diagram: the shielded leg enters as a dashed rail,
 * crosses a single hairline where privacy ends, and leaves as a solid rail into
 * a public block. Drawn flat, in the site's stroke weights.
 */
function SettlementDiagram() {
  return (
    <svg
      className="settle-art"
      viewBox="0 0 420 320"
      fill="none"
      role="img"
      aria-label="A shielded payment entering on a dashed rail, crossing into a public settlement block"
    >
      {/* shielded side */}
      <rect x="18" y="94" width="132" height="132" rx="10" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" />
      <text x="34" y="122" fill="rgba(255,255,255,0.52)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.4">
        SHIELDED
      </text>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x="34"
          y={140 + i * 20}
          width={96 - i * 14}
          height="8"
          rx="2"
          fill="rgba(165,150,255,0.4)"
        />
      ))}

      {/* rails across the crossing */}
      {[128, 160, 192].map((y) => (
        <g key={y}>
          <path d={`M150 ${y}H210`} stroke="rgba(165,150,255,0.7)" strokeWidth="1.4" strokeDasharray="7 7" />
          <path d={`M210 ${y}H270`} stroke="rgba(94,224,171,0.85)" strokeWidth="1.4" />
        </g>
      ))}
      <path d="M210 74V246" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
      <text
        x="210"
        y="64"
        fill="rgba(255,255,255,0.5)"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="1.2"
        textAnchor="middle"
      >
        CROSSING
      </text>

      {/* nodes only become solid past the crossing */}
      <circle cx="180" cy="128" r="3.4" stroke="rgba(165,150,255,0.9)" strokeWidth="1.4" />
      <circle cx="180" cy="192" r="3.4" stroke="rgba(165,150,255,0.9)" strokeWidth="1.4" />
      <circle cx="244" cy="160" r="4" fill="#5ee0ab" />

      {/* public block */}
      <rect x="270" y="94" width="132" height="132" rx="10" fill="rgba(94,224,171,0.1)" stroke="rgba(94,224,171,0.5)" strokeWidth="1.4" />
      <text x="286" y="122" fill="rgba(94,224,171,0.9)" fontSize="11" fontFamily="var(--font-mono)" letterSpacing="1.4">
        PUBLIC
      </text>
      <text x="286" y="152" fill="rgba(255,255,255,0.85)" fontSize="13" fontFamily="var(--font-mono)">
        250.00 USDC
      </text>
      <text x="286" y="176" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="var(--font-mono)">
        0xf4e8...c91a
      </text>
      <text x="286" y="198" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="var(--font-mono)">
        block 18,442,907
      </text>
      <path d="M286 212h96" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  );
}

export function Reconcile() {
  return (
    <section className="section pb-lg" id="reconcile">
      <div className="container split-stack">
        <div className="split reveal">
          <div className="split-copy">
            <p className="eyebrow">{RECONCILE.eyebrow}</p>
            <h2>{RECONCILE.heading}</h2>
            <p className="body-copy split-body">{RECONCILE.body}</p>
          </div>

          <div className="split-art">
            <ol className="flow-stack">
              {RECONCILE.flow.map((step) => (
                <li key={step.state} className={`flow-row${step.active ? ' is-active' : ''}`}>
                  <span className="flow-state num">{step.state}</span>
                  <span className="flow-note">{step.note}</span>
                  {step.active ? (
                    <span className="flow-tick">
                      <IconCheck size={13} />
                    </span>
                  ) : (
                    <IconArrowRight size={14} className="flow-caret" />
                  )}
                </li>
              ))}
            </ol>

            <ul className="flow-terminal">
              {RECONCILE.terminal.map((step) => (
                <li key={step.state}>
                  <span className="flow-state num">{step.state}</span>
                  <span className="flow-note">{step.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="split split--ink reveal">
          <div className="split-figure">
            <SettlementDiagram />
          </div>
          <div className="split-copy split-copy--ink">
            <p className="eyebrow eyebrow--onDark">{SETTLEMENT.eyebrow}</p>
            <h2>{SETTLEMENT.heading}</h2>
            <p className="body-copy split-body split-body--ink">{SETTLEMENT.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
