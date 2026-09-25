import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCheckoutViews, useMerchant } from '../merchant';
import { ENV, CHAIN_ID } from '../config';
import { apiConfigured, pingApi } from '../lib/api';
import { hmacHex, safeEqual, webhookBody } from '../lib/webhook';
import { CopyButton, KV, PageHead, PanelHead } from '../ui';

const EVENTS = [
  ['checkout.created', 'A quote was issued and the shielded address is live.'],
  ['settlement_complete', 'The payout reached the settlement address for the exact amount.'],
  ['settlement_partial', 'A payout smaller than the quote was attached to the checkout.'],
  ['checkout.expired', 'The quote window passed with no payout.'],
  ['checkout.cancelled', 'The merchant cancelled the checkout.'],
] as const;

export function Developers() {
  const { ledger, settlementAddress, token } = useMerchant();
  const views = useCheckoutViews();
  const [ping, setPing] = useState<{ ok: boolean; detail: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void pingApi().then((p) => alive && setPing(p));
    return () => {
      alive = false;
    };
  }, []);

  const request = JSON.stringify(
    {
      merchant_name: ledger.profile.merchantName || 'Your store',
      order_ref: 'ZN-ORDER-0001',
      payout_amount: '250.00',
      payout_asset: token.symbol,
      settlement_address: settlementAddress,
      ...(ledger.profile.webhookUrl ? { webhook_url: ledger.profile.webhookUrl } : {}),
    },
    null,
    2,
  );
  // No invented host: until the API URL is configured the example says so.
  const base = ENV.apiUrl || '<VITE_ZRAIL_API_URL>';
  const curl = `curl -X POST '${base}/api/checkouts' \\
  -H 'content-type: application/json' \\
  --data '${request.replace(/'/g, `'\\''`)}'`;

  const sample = views[0] ? webhookBody(views[0]) : `{\n  "event": "settlement_complete",\n  "checkout_id": "chk_example"\n}`;
  const [payload, setPayload] = useState(sample);
  const [digest, setDigest] = useState('');
  const [candidate, setCandidate] = useState('');
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    let alive = true;
    void hmacHex(ledger.profile.webhookSecret, payload).then((h) => alive && setDigest(`sha256=${h}`));
    return () => {
      alive = false;
    };
  }, [payload, ledger.profile.webhookSecret]);

  const verdict = candidate.trim() ? safeEqual(candidate.trim(), digest) : null;
  const secret = ledger.profile.webhookSecret;

  return (
    <>
      <PageHead index="05" title="Developers" lede="Wire ZRail into your backend: create checkouts over the API and verify signed webhooks." />

      <div className="dash-grid-2">
        <section className="dash-panel">
          <PanelHead eyebrow="Environment" title="Connections" />
          <div className="dash-kvs">
            <KV k="Checkout API">
              {apiConfigured() ? (
                <span className={`chip ${ping?.ok ? 'chip--settle' : 'chip--signal'}`}>{ping ? ping.detail : 'Checking...'}</span>
              ) : (
                <span className="chip chip--signal">Not configured</span>
              )}
            </KV>
            <KV k="API base URL">
              <span className="num dash-break">{ENV.apiUrl || 'VITE_ZRAIL_API_URL is empty'}</span>
            </KV>
            <KV k="Chain">
              <span className="num">Robinhood Chain · {CHAIN_ID}</span>
            </KV>
            <KV k="RPC">
              <span className="num dash-break">{ENV.rpcUrl}</span>
            </KV>
            <KV k="Payout asset">
              <span className="num">
                {token.symbol} · {token.address}
              </span>
            </KV>
          </div>
          {!apiConfigured() ? (
            <p className="dash-note">
              Shielded ZEC addresses come from the checkout API. Set <code>VITE_ZRAIL_API_URL</code> in <code>.env</code> and
              restart; new checkouts will then carry a single-use shielded address.
            </p>
          ) : null}
        </section>

        <section className="dash-panel">
          <PanelHead eyebrow="Webhook secret" title="Signing key" action={<CopyButton value={secret} label="Copy secret" />} />
          <p className="num dash-break dash-secret">{reveal ? secret : `${secret.slice(0, 10)}${'•'.repeat(24)}`}</p>
          <div className="dash-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReveal((v) => !v)}>
              {reveal ? 'Hide' : 'Reveal'}
            </button>
            <Link to="/app/settings" className="btn btn--ghost btn--sm">
              Rotate in Settings
            </Link>
          </div>
          <p className="dash-note">
            Every webhook carries <code>x-zrail-signature: sha256=&lt;hex&gt;</code>, an HMAC-SHA256 of the raw body with this
            secret. Compare in constant time before trusting the body.
          </p>
        </section>
      </div>

      <section className="dash-panel">
        <PanelHead eyebrow="Request builder" title="POST /api/checkouts" action={<CopyButton value={curl} label="Copy curl" />} />
        <pre className="dash-code">
          <code>{curl}</code>
        </pre>
        <p className="dash-note">Filled with your settlement address and webhook URL. The response carries the checkout id and the shielded address.</p>
      </section>

      <section className="dash-panel">
        <PanelHead eyebrow="Webhook tester" title="Sign and verify a payload" />
        <div className="dash-grid-2 dash-grid-2--tight">
          <label className="dash-field">
            <span className="access-label">Raw body</span>
            <textarea className="dash-input dash-textarea num" value={payload} onChange={(e) => setPayload(e.target.value)} spellCheck={false} rows={12} />
          </label>
          <div className="dash-stack">
            <div className="dash-field">
              <span className="access-label">Expected signature</span>
              <p className="num dash-break dash-secret">{digest || '...'}</p>
              {digest ? <CopyButton value={digest} label="Copy signature" /> : null}
            </div>
            <label className="dash-field">
              <span className="access-label">Signature your server received</span>
              <input className="dash-input num" value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="sha256=..." spellCheck={false} />
            </label>
            {verdict === null ? null : verdict ? (
              <p className="chip chip--settle">Valid: body and secret match</p>
            ) : (
              <p className="dash-alert">Does not match. Check the body is byte-for-byte identical and the secret is current.</p>
            )}
          </div>
        </div>
      </section>

      <section className="dash-panel">
        <PanelHead eyebrow="Reference" title="Webhook events" />
        <ul className="dash-events">
          {EVENTS.map(([name, what]) => (
            <li key={name}>
              <code className="num">{name}</code>
              <span>{what}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
