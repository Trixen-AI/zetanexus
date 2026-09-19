import { useRef, useState, type FormEvent } from 'react';
import { isAddress, getAddress } from 'viem';
import { useMerchant } from '../merchant';
import { PAYOUT_TOKENS, explorerAddress } from '../config';
import { newSecret, replaceLedger } from '../lib/ledger';
import { shortAddr } from '../lib/format';
import { AddressLink, PageHead, PanelHead } from '../ui';
import { IconArrowUpRight } from '../../components/ui/Icons';

export function Settings() {
  const { wallet, ledger, actions } = useMerchant();
  const p = ledger.profile;

  const [name, setName] = useState(p.merchantName);
  const [settle, setSettle] = useState(p.settlementAddress || '');
  const [token, setToken] = useState(p.payoutToken);
  const [expiry, setExpiry] = useState(String(p.expiryMinutes));
  const [hook, setHook] = useState(p.webhookUrl);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const settleValid = settle === '' || isAddress(settle);
  const hookValid = hook === '' || /^https:\/\/[^\s]+$/i.test(hook) || /^http:\/\/localhost(:\d+)?\//i.test(hook);
  const expiryNum = Number(expiry);
  const expiryValid = Number.isInteger(expiryNum) && expiryNum >= 5 && expiryNum <= 1440;
  const dirty =
    name !== p.merchantName || settle !== (p.settlementAddress || '') || token !== p.payoutToken || expiry !== String(p.expiryMinutes) || hook !== p.webhookUrl;

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!settleValid || !hookValid || !expiryValid) return;
    actions.saveProfile({
      merchantName: name.trim(),
      settlementAddress: settle ? (getAddress(settle) as `0x${string}`) : '',
      payoutToken: token,
      expiryMinutes: expiryNum,
      webhookUrl: hook.trim(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const rotate = () => {
    if (!window.confirm('Rotate the webhook secret? Your server must switch to the new secret, or it will reject events.')) return;
    actions.saveProfile({ webhookSecret: newSecret() });
    setNotice('Webhook secret rotated.');
  };

  const exportLedger = () => {
    const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `zetanexus-ledger-${shortAddr(wallet, 6, 4)}.json` }).click();
    URL.revokeObjectURL(url);
  };

  const importLedger = async (file: File) => {
    try {
      const ok = replaceLedger(wallet, JSON.parse(await file.text()));
      setNotice(ok ? 'Ledger restored from backup.' : 'That file is not a ZetaNexus ledger backup.');
      if (ok) window.location.reload();
    } catch {
      setNotice('Could not read that file.');
    }
  };

  const clear = () => {
    if (!window.confirm('Delete every checkout and setting for this wallet in this browser? Export a backup first if you need it.')) return;
    actions.clear();
    setNotice('Ledger cleared.');
  };

  return (
    <>
      <PageHead index="06" title="Settings" lede="Your store, where payouts land, and how ZetaNexus talks to your backend." />

      <form className="dash-panel dash-form" onSubmit={save}>
        <PanelHead eyebrow="Store" title="Merchant profile" />
        <div className="dash-grid-2 dash-grid-2--tight">
          <label className="dash-field">
            <span className="access-label">Store name</span>
            <input className="dash-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="ZetaNexus Demo Store" />
          </label>
          <label className="dash-field">
            <span className="access-label">Default quote expiry (minutes)</span>
            <input className="dash-input num" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(e.target.value)} aria-invalid={!expiryValid} />
            {!expiryValid ? <span className="dash-field-error">Between 5 and 1440 minutes.</span> : null}
          </label>
        </div>

        <PanelHead eyebrow="Payouts" title="Settlement" />
        <div className="dash-grid-2 dash-grid-2--tight">
          <label className="dash-field">
            <span className="access-label">Settlement address on Robinhood Chain</span>
            <input className="dash-input num" value={settle} onChange={(e) => setSettle(e.target.value.trim())} placeholder={wallet} spellCheck={false} aria-invalid={!settleValid} />
            {!settleValid ? (
              <span className="dash-field-error">Not a valid address.</span>
            ) : (
              <span className="dash-field-hint">
                Empty uses your connected wallet (<AddressLink address={wallet} />). Balances and settlements are read for this address.
              </span>
            )}
          </label>
          <label className="dash-field">
            <span className="access-label">Payout asset</span>
            <select className="dash-input" value={token} onChange={(e) => setToken(e.target.value as `0x${string}`)}>
              {PAYOUT_TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol} · {t.name} ({t.issuer})
                </option>
              ))}
            </select>
            <span className="dash-field-hint">
              <a className="dash-link num" href={explorerAddress(token)} target="_blank" rel="noopener noreferrer">
                {shortAddr(token, 8, 6)} <IconArrowUpRight size={11} />
              </a>{' '}
              is Robinhood Chain's documented mainnet stablecoin.
            </span>
          </label>
        </div>

        <PanelHead eyebrow="Backend" title="Webhook" />
        <label className="dash-field">
          <span className="access-label">Webhook URL</span>
          <input className="dash-input num" value={hook} onChange={(e) => setHook(e.target.value.trim())} placeholder="https://z2r-nexus.com/hooks/z2r" spellCheck={false} aria-invalid={!hookValid} />
          {!hookValid ? <span className="dash-field-error">Use an https:// URL (http:// only for localhost).</span> : null}
        </label>

        <div className="dash-actions">
          <button type="submit" className="btn btn--ink" disabled={!dirty || !settleValid || !hookValid || !expiryValid}>
            {saved ? 'Saved' : 'Save changes'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={rotate}>
            Rotate webhook secret
          </button>
        </div>
      </form>

      <section className="dash-panel">
        <PanelHead eyebrow="Data" title="Ledger backup" />
        <p className="dash-muted">
          Checkouts and settings for <span className="num">{shortAddr(wallet)}</span> are stored in this browser. Export a backup to
          move them to another device; settlements are re-read from Robinhood Chain wherever you import it.
        </p>
        <div className="dash-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={exportLedger}>
            Export backup
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importLedger(f);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm dash-danger" onClick={clear}>
            Clear ledger
          </button>
        </div>
        {notice ? (
          <p className="dash-note" role="status">
            {notice}
          </p>
        ) : null}
      </section>
    </>
  );
}
