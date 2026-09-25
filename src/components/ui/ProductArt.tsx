import type { MarketKind } from '../../data/site';

/* --- small original visuals, one per product ------------------------------ */

function EsimArt() {
  // a SIM outline whose chip is a scan grid
  const cells = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1];
  return (
    <svg viewBox="0 0 120 80" className="ticket-art-svg" aria-hidden="true">
      <path d="M22 8h54l16 16v48H22z" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <g transform="translate(38 26)">
        {cells.map((on, i) => (on ? <rect key={i} x={(i % 4) * 9} y={Math.floor(i / 4) * 9} width="7" height="7" fill="var(--verdigris)" /> : null))}
      </g>
      <path d="M86 40h24M104 34l6 6-6 6" stroke="var(--settle-deep)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function AiArt() {
  return (
    <div className="ticket-art-term num" aria-hidden="true">
      <span className="ticket-art-dim">&gt;</span> summarise this<span className="ticket-art-caret" />
      <span className="ticket-art-row">
        <span>credit</span>
        <span className="ticket-art-bar">
          <i style={{ width: '64%' }} />
        </span>
      </span>
    </div>
  );
}

function ServerArt() {
  return (
    <div className="ticket-art-rack" aria-hidden="true">
      {['root@nr-01', 'uptime 31d', 'ssh :22'].map((t, i) => (
        <span key={t} className="num">
          <i className={i === 0 ? 'is-on' : ''} />
          {t}
        </span>
      ))}
    </div>
  );
}

function VpnArt() {
  return (
    <svg viewBox="0 0 120 80" className="ticket-art-svg" aria-hidden="true">
      <circle cx="16" cy="40" r="6" fill="var(--bone)" />
      <path d="M22 40H98" stroke="var(--verdigris)" strokeWidth="10" strokeOpacity="0.18" strokeLinecap="round" />
      <path d="M26 40H94" stroke="var(--verdigris)" strokeWidth="1.5" strokeDasharray="5 5" />
      <rect x="98" y="30" width="16" height="20" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      <text x="16" y="62" textAnchor="middle" className="ticket-art-label">you</text>
      <text x="106" y="62" textAnchor="middle" className="ticket-art-label">web</text>
    </svg>
  );
}

function ProxyArt() {
  // documentation ranges (RFC 5737), not real addresses
  return (
    <ul className="ticket-art-ips num" aria-hidden="true">
      <li className="is-on">203.0.113.7</li>
      <li>198.51.100.24</li>
      <li>192.0.2.61</li>
    </ul>
  );
}

function DomainArt() {
  return (
    <div className="ticket-art-dns num" aria-hidden="true">
      <p>
        <span className="ticket-art-dim">your</span>name<span className="ticket-art-hot">.xyz</span>
      </p>
      <span>A</span>
      <span>MX</span>
      <span>TXT</span>
    </div>
  );
}

export const PRODUCT_ART: Record<MarketKind, () => React.JSX.Element> = {
  esim: EsimArt,
  ai: AiArt,
  server: ServerArt,
  vpn: VpnArt,
  proxy: ProxyArt,
  domain: DomainArt,
};
