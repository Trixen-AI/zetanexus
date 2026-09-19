import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import QRCode from 'qrcode';
import type { Address } from 'viem';
import { decodePay, zcashUri } from '../lib/paylink';
import { useIncomingTransfers } from '../lib/transfers';
import { tokenByAddress, explorerTx } from '../config';
import { fmtCountdown, fmtDateTime, shortAddr, toUnits } from '../lib/format';
import { Logo } from '../../brand/Logo';
import { RailField } from '../../components/ui/RailField';
import { IconArrowUpRight, IconCheck, IconCopy, IconLock } from '../../components/ui/Icons';
import { formatUsd } from '../../lib/zecPrice';
import '../../styles/dashboard.css';

/**
 * The page a customer opens from a payment link. It needs no wallet: it shows
 * the locked quote and reads the payout from Robinhood Chain directly, so the
 * "paid" state can never be faked by editing the link.
 */
export function PayPage() {
  const { token = '' } = useParams();
  const p = decodePay(token);
  if (!p) {
    return (
      <PayFrame>
        <p className="eyebrow">Payment link</p>
        <h1 className="dash-gate-title">This link is not valid.</h1>
        <p className="lede">Ask the merchant for a new payment link.</p>
      </PayFrame>
    );
  }
  return <PayBody key={token} p={p} />;
}

function PayFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-gate">
      <header className="dash-gate-bar container">
        <Link to="/" className="nav-logo" aria-label="ZetaNexus">
          <Logo />
        </Link>
        <span className="chip chip--shield">
          <IconLock size={12} /> Shielded checkout
        </span>
      </header>
      <main className="container">
        <div className="dash-gate-card">
          <RailField className="hero-field" />
          <div className="dash-gate-body dash-pay">{children}</div>
        </div>
      </main>
    </div>
  );
}

function PayBody({ p }: { p: NonNullable<ReturnType<typeof decodePay>> }) {
  const meta = tokenByAddress(p.t);
  const decimals = meta?.decimals ?? 6;
  const symbol = meta?.symbol ?? 'TOKEN';
  const payout = toUnits(p.p, decimals) ?? 0n;
  const created = BigInt(p.b);

  const idx = useIncomingTransfers(p.t, p.s as Address, 10_000);
  const { index, floor } = idx;
  useEffect(() => {
    if (index && floor !== null && created < floor) void index.ensureFrom(created);
  }, [index, floor, created]);

  const paid = idx.transfers.find((t) => t.block >= created && t.value === payout);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = p.e - now;
  const expired = left <= 0 && !paid;

  const uri = p.a ? zcashUri(p.a, p.z, p.o) : null;
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!uri) return;
    let alive = true;
    void QRCode.toDataURL(uri, { margin: 1, width: 360, color: { dark: '#0d0f12', light: '#ffffff' } }).then((u) => alive && setQr(u));
    return () => {
      alive = false;
    };
  }, [uri]);
  const [copied, setCopied] = useState(false);

  return (
    <PayFrame>
      <p className="eyebrow">{p.m}</p>
      <h1 className="dash-gate-title">
        Pay <span className="num">{p.z} ZEC</span>
      </h1>
      <p className="lede">
        Order <span className="num">{p.o}</span> · settles as {formatUsd(Number(p.p))} {symbol} on Robinhood Chain at 1 ZEC ={' '}
        {formatUsd(p.r)} USD.
      </p>

      {paid ? (
        <div className="dash-pay-state is-paid" role="status">
          <span className="access-done-mark">
            <IconCheck size={18} />
          </span>
          <div>
            <p className="dash-pay-state-title">Payment settled</p>
            <p className="dash-muted">
              {paid.timestamp ? fmtDateTime(paid.timestamp * 1000) : `Block ${paid.block}`} ·{' '}
              <a className="dash-link num" href={explorerTx(paid.txHash)} target="_blank" rel="noopener noreferrer">
                {shortAddr(paid.txHash, 8, 6)} <IconArrowUpRight size={11} />
              </a>
            </p>
          </div>
        </div>
      ) : expired ? (
        <div className="dash-pay-state is-expired" role="status">
          <p className="dash-pay-state-title">This quote has expired</p>
          <p className="dash-muted">Do not send ZEC to it. Ask {p.m} for a new payment link at the current rate.</p>
        </div>
      ) : (
        <div className="dash-pay-grid">
          {p.a ? (
            <>
              {qr ? <img className="dash-qr dash-qr--lg" src={qr} alt={`Zcash payment request for ${p.z} ZEC`} /> : <div className="dash-qr dash-qr--lg" />}
              <div className="dash-stack">
                <p className="mock-label">Send exactly</p>
                <p className="dash-quote-zec num">{p.z} ZEC</p>
                <p className="mock-label">To this shielded address</p>
                <p className="num dash-break">{p.a}</p>
                <button
                  type="button"
                  className="checkout-copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(p.a ?? '');
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1400);
                    } catch {
                      /* on screen */
                    }
                  }}
                >
                  <span className="num">{shortAddr(p.a, 10, 8)}</span>
                  {copied ? <IconCheck /> : <IconCopy />}
                </button>
              </div>
            </>
          ) : (
            <div className="dash-api-note">
              <IconLock size={13} />
              The merchant has not been issued a shielded ZEC address for this order yet. Do not send funds until the link shows one.
            </div>
          )}
        </div>
      )}

      {!paid && !expired ? (
        <p className="dash-scan num">
          <span className="dash-spinner" aria-hidden="true" />
          Quote expires in {fmtCountdown(left)} · watching Robinhood Chain for the payout
        </p>
      ) : null}
      {idx.error ? <p className="dash-note">Chain status temporarily unavailable: {idx.error}</p> : null}
    </PayFrame>
  );
}
