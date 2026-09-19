import { useState, type ReactNode } from 'react';
import { IconArrowUpRight, IconCheck, IconCopy } from '../components/ui/Icons';
import { explorerAddress, explorerTx } from './config';
import { shortAddr, shortHash } from './lib/format';
import { STATUS_LABEL, STATUS_TONE, type CheckoutStatus } from './lib/reconcile';

export function StatusChip({ status, late }: { status: CheckoutStatus; late?: boolean }) {
  const tone = STATUS_TONE[status];
  return (
    <span className={`chip dash-status dash-status--${tone}`}>
      <i className={`dot${status === 'awaiting_payment' ? ' dot--pulse' : ''}`} />
      {STATUS_LABEL[status]}
      {late ? <span className="dash-status-late">late</span> : null}
    </span>
  );
}

export function CopyButton({ value, label = 'Copy', compact = false }: { value: string; label?: string; compact?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard blocked; the value is on screen */
    }
  };
  return (
    <button type="button" className={`dash-copy${compact ? ' dash-copy--compact' : ''}`} onClick={copy} title={`Copy ${value}`}>
      {done ? <IconCheck size={13} /> : <IconCopy size={13} />}
      {compact ? null : done ? 'Copied' : label}
    </button>
  );
}

export function TxLink({ hash, full = false }: { hash: string; full?: boolean }) {
  return (
    <a className="dash-link num" href={explorerTx(hash)} target="_blank" rel="noopener noreferrer">
      {full ? hash : shortHash(hash)}
      <IconArrowUpRight size={11} />
    </a>
  );
}

export function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a className="dash-link num" href={explorerAddress(address)} target="_blank" rel="noopener noreferrer" title={address}>
      {label ?? shortAddr(address)}
      <IconArrowUpRight size={11} />
    </a>
  );
}

export function PanelHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <header className="dash-panel-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="dash-panel-title">{title}</h2>
      </div>
      {action ?? null}
    </header>
  );
}

export function Empty({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="dash-empty">
      <p className="dash-empty-title">{title}</p>
      <p className="dash-empty-body">{body}</p>
      {action ?? null}
    </div>
  );
}

export function PageHead({ index, title, lede, action }: { index: string; title: string; lede?: string; action?: ReactNode }) {
  return (
    <header className="dash-page-head">
      <div>
        <p className="dash-page-index num">{index}</p>
        <h1 className="dash-page-title">{title}</h1>
        {lede ? <p className="dash-page-lede">{lede}</p> : null}
      </div>
      {action ?? null}
    </header>
  );
}

export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="dash-kv">
      <span className="mock-label">{k}</span>
      <span className="dash-kv-v">{children}</span>
    </div>
  );
}
