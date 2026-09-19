import { useState, type ReactNode } from 'react';
import { IconArrowUpRight, IconCheck, IconCopy } from '../ui/Icons';
import { DEMO, INTEGRATION, integrationTabs } from '../../data/site';
import { formatZec, useZecPrice, zecFor } from '../../lib/zecPrice';

/** Minimal JSON colouriser. Enough for the three payloads shown here. */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(line))) {
    if (match.index > last) out.push(line.slice(last, match.index));
    if (match[1]) {
      out.push(
        <span key={key++} className={match[2] ? 'tok-key' : 'tok-str'}>
          {match[1]}
        </span>,
      );
      if (match[2]) out.push(match[2]);
    } else if (match[3]) {
      out.push(
        <span key={key++} className="tok-lit">
          {match[3]}
        </span>,
      );
    } else if (match[4]) {
      out.push(
        <span key={key++} className="tok-num">
          {match[4]}
        </span>,
      );
    }
    last = re.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function Integration() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const price = useZecPrice();
  const zec = zecFor(DEMO.payoutUsd, price);
  const tabs = integrationTabs(zec === null ? null : formatZec(zec));
  const tab = tabs[active];
  const lines = tab.code.split('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked, the payload is on screen anyway */
    }
  };

  return (
    <section className="section integration" id="integration">
      <div className="integration-flare" aria-hidden="true" />
      <div className="container integration-container">
        <div className="head-center integration-head" data-reveal-group>
          <p className="eyebrow eyebrow--onDark reveal">{INTEGRATION.eyebrow}</p>
          <h2 className="integration-title reveal">
            <span className="integration-title-accent">API-first</span> checkout
          </h2>
          <p className="lede lede--onDark reveal">{INTEGRATION.lede}</p>
        </div>

        <div className="code-panel reveal">
          <header className="code-head">
            <div className="code-tabs" role="tablist" aria-label="Checkout payloads">
              {tabs.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  className={`code-tab${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {t.title}
                </button>
              ))}
            </div>
            <div className="code-actions">
              <button type="button" className="code-copy" onClick={copy}>
                {copied ? <IconCheck /> : <IconCopy />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a className="btn btn--brand btn--sm" href={INTEGRATION.docs.href}>
                {INTEGRATION.docs.label}
                <IconArrowUpRight size={13} />
              </a>
            </div>
          </header>

          <div className="code-body">
            <span className="code-lang num">{tab.lang}</span>
            <pre>
              <code>
                {lines.map((line, i) => (
                  <span className="code-line" key={i}>
                    <span className="code-ln">{i + 1}</span>
                    <span className="code-text">{highlight(line)}</span>
                  </span>
                ))}
              </code>
            </pre>
          </div>

          <footer className="code-foot">{tab.note}</footer>
        </div>
      </div>
    </section>
  );
}
