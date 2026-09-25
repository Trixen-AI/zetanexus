import { useState } from 'react';
import { IconArrowUpRight, IconCheck, IconCopy } from './Icons';
import { TOKEN } from '../../data/site';

/**
 * The token contract address, copyable. Renders nothing until CONTRACTS.token is
 * set in src/data/site.ts, so no placeholder address ever reaches the page.
 */
export function ContractRow({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const ca = TOKEN.ca;

  // No contract yet: nothing to show. The row appears once CONTRACTS.token is set.
  if (!ca) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the address is on screen */
    }
  };
  const short = `${ca.slice(0, 8)}...${ca.slice(-6)}`;
  return (
    <div className={`hero-ca${compact ? ' hero-ca--compact' : ''}`}>
      <span className="hero-ca-key">
        CA <span className="hero-ca-symbol">${TOKEN.symbol}</span>
      </span>
      <button type="button" className="hero-ca-value num" onClick={copy} title="Copy contract address" aria-label={`Copy contract address ${ca}`}>
        <span className="hero-ca-full">{ca}</span>
        <span className="hero-ca-short">{short}</span>
        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      </button>
      <a className="hero-ca-link" href={`${TOKEN.explorerBase}${ca}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${TOKEN.symbol} on ${TOKEN.explorerName}`}>
        <IconArrowUpRight size={14} />
      </a>
      {copied ? (
        <span className="hero-ca-toast" role="status">
          Copied
        </span>
      ) : null}
    </div>
  );
}
