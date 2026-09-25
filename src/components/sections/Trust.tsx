import { PRIVACY, TRUST } from '../../data/site';
import { useContractReport, useZzecBacking } from '../../lib/chain';
import { IconCheck, IconClose } from '../ui/Icons';

/** zZEC backing read live, the privacy split, and what the token can never do. */
export function Trust() {
  const b = useZzecBacking();
  const report = useContractReport();
  const checks = new Map(report.checks.map((c) => [c.label, c]));
  const ratio = b.reserve !== null && b.owed ? (b.reserve / b.owed) * 100 : null;
  const checked = b.at ? new Date(b.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <section className="section pb-lg" id="trust">
      <div className="container">
        <p className="section-index reveal">
          <b>03</b> / {TRUST.eyebrow}
        </p>
        <div className="trust-head" data-reveal-group>
          <h2 className="reveal">{TRUST.heading}</h2>
          <p className="lede reveal">{TRUST.lede}</p>
        </div>

        <div className="trust-grid">
          <div className="zzec-meter ticket reveal">
            <p className="eyebrow">zZEC backing{checked ? ` · ${checked}` : ''}</p>
            <p className="zzec-ratio num">
              {ratio !== null ? `${ratio.toFixed(2)}%` : '...'}
              <span>backed</span>
            </p>
            <div className="zzec-bar" aria-hidden="true">
              <i style={{ width: `${ratio !== null ? Math.min(100, (100 / ratio) * 100) : 0}%` }} />
            </div>
            <dl className="zzec-rows">
              <div>
                <dt>ZEAL reserve · live</dt>
                <dd className="num">{b.reserve !== null ? `${b.reserve.toFixed(5)} ZEC` : '...'}</dd>
              </div>
              <div>
                <dt>zZEC in circulation · live</dt>
                <dd className="num">{b.owed !== null ? `${b.owed.toFixed(5)} ZEC` : '...'}</dd>
              </div>
            </dl>
          </div>

          <div className="trust-privacy reveal">
            {PRIVACY.columns.map((c) => (
              <div className={`trust-col trust-col--${c.tone}`} key={c.key}>
                <p className={`chip chip--${c.tone}`}>{c.title}</p>
                <ul>
                  {c.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <ul className="std-row" data-reveal-group aria-label="What the token contract can never do">
          {TRUST.never.map((label) => {
            const c = checks.get(label);
            return (
              <li className={`std-chip reveal${c ? ` is-${c.state}` : ''}`} key={label} title={c?.detail}>
                <span className="std-never num">Never</span>
                <span className="std-label">{label}</span>
                {c?.state === 'pass' ? <IconCheck size={13} /> : c?.state === 'fail' ? <IconClose size={13} /> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
