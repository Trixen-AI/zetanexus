import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import QRCode from 'qrcode';
import { useMerchant, useNow } from '../merchant';
import { viewOf } from '../lib/reconcile';
import { fmtCountdown, fmtDateTime, fmtToken, shortAddr } from '../lib/format';
import { payPayload, payUrl, zcashUri } from '../lib/paylink';
import { hmacHex, signedCurl, webhookBody } from '../lib/webhook';
import { apiConfigured } from '../lib/api';
import { AddressLink, CopyButton, Empty, KV, PageHead, PanelHead, StatusChip, TxLink } from '../ui';
import { IconArrowUpRight, IconLock } from '../../components/ui/Icons';
import { formatUsd } from '../../lib/zecPrice';

function useQr(value: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!value) {
      setSrc(null);
      return;
    }
    QRCode.toDataURL(value, { margin: 1, width: 320, color: { dark: '#000000', light: '#ffffff' }, errorCorrectionLevel: 'M' })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value]);
  return src;
}

export function CheckoutDetail() {
  const { id = '' } = useParams();
  const { ledger, actions, transfers, token } = useMerchant();
  const now = useNow(1000);
  const raw = ledger.checkouts.find((c) => c.id === id);

  if (!raw) {
    return (
      <>
        <PageHead index="02" title="Checkout not found" />
        <Empty
          title="This checkout is not in this wallet's ledger"
          body="Checkouts are stored per connected wallet. Switch to the wallet that created it, or import a ledger backup in Settings."
          action={
            <Link to="/app/checkouts" className="btn btn--ink btn--sm">
              Back to checkouts
            </Link>
          }
        />
      </>
    );
  }

  return <Detail key={raw.id} now={now} merchantName={ledger.profile.merchantName} webhookUrl={ledger.profile.webhookUrl} secret={ledger.profile.webhookSecret} actions={actions} checkoutId={raw.id} checkouts={ledger.checkouts} scanning={transfers.syncing || transfers.loadingOlder} head={transfers.head} tokenSymbol={token.symbol} />;
}

type DetailProps = {
  checkoutId: string;
  checkouts: ReturnType<typeof useMerchant>['ledger']['checkouts'];
  now: number;
  merchantName: string;
  webhookUrl: string;
  secret: string;
  actions: ReturnType<typeof useMerchant>['actions'];
  scanning: boolean;
  head: bigint | null;
  tokenSymbol: string;
};

function Detail({ checkoutId, checkouts, now, merchantName, webhookUrl, secret, actions, scanning, head, tokenSymbol }: DetailProps) {
  const c = viewOf(checkouts.find((x) => x.id === checkoutId)!, now);
  const link = useMemo(() => payUrl(payPayload(c, merchantName)), [c, merchantName]);
  const linkQr = useQr(link);
  const walletUri = c.shieldedAddress ? zcashUri(c.shieldedAddress, c.zec.amount, `${c.orderRef}`) : null;
  const walletQr = useQr(walletUri);

  const body = webhookBody(c);
  const [signature, setSignature] = useState('');
  const [curl, setCurl] = useState('');
  useEffect(() => {
    let alive = true;
    void hmacHex(secret, body).then((s) => alive && setSignature(`sha256=${s}`));
    void signedCurl(webhookUrl, secret, body).then((s) => alive && setCurl(s));
    return () => {
      alive = false;
    };
  }, [secret, body, webhookUrl]);

  const left = c.expiresAt - now;
  const open = c.status === 'awaiting_payment';

  const downloadReceipt = () => {
    const receipt = { ...c, payoutUnits: c.payoutUnits.toString(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `${c.orderRef}-receipt.json` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead
        index="02"
        title={c.orderRef}
        lede={c.description || undefined}
        action={
          <div className="dash-actions">
            <StatusChip status={c.status} late={c.late} />
            <Link to="/app/checkouts" className="btn btn--ghost btn--sm">
              All checkouts
            </Link>
          </div>
        }
      />

      <div className="dash-grid-detail">
        <section className="dash-panel">
          <PanelHead eyebrow="Quote" title={`${c.zec.amount} ZEC`} />
          <div className="dash-kvs">
            <KV k="Payout">
              <span className="num">
                {fmtToken(c.payoutUnits, c.decimals)} {c.symbol}
              </span>
            </KV>
            <KV k="Rate locked">
              <span className="num">1 ZEC = {formatUsd(c.zec.rate)} USD</span>
            </KV>
            <KV k="Quoted">
              <span className="num">
                {fmtDateTime(c.zec.quotedAt)} via {c.zec.source}
              </span>
            </KV>
            <KV k="Checkout id">
              <span className="num">{c.apiId ?? c.id}</span>
            </KV>
            <KV k="Created in block">
              <span className="num">{Number(c.createdBlock).toLocaleString()}</span>
            </KV>
            <KV k={open ? 'Expires in' : 'Expired at'}>
              <span className={`num${open && left < 120_000 ? ' dash-down' : ''}`}>
                {open ? fmtCountdown(left) : fmtDateTime(c.expiresAt)}
              </span>
            </KV>
          </div>
        </section>

        <section className="dash-panel">
          <PanelHead eyebrow="Shielded payment" title={c.shieldedAddress ? 'Customer pays here' : 'No shielded address issued'} />
          {c.shieldedAddress ? (
            <div className="dash-shielded">
              {walletQr ? <img className="dash-qr" src={walletQr} alt={`Zcash payment request for ${c.zec.amount} ZEC`} /> : null}
              <div className="dash-shielded-body">
                <p className="mock-label">Single-use shielded address</p>
                <p className="num dash-break">{c.shieldedAddress}</p>
                <div className="dash-actions">
                  <CopyButton value={c.shieldedAddress} label="Copy address" />
                  {walletUri ? <CopyButton value={walletUri} label="Copy ZIP-321 URI" /> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="dash-api-note">
              <IconLock size={13} />
              {apiConfigured()
                ? 'The API did not return a shielded address for this checkout.'
                : 'Shielded addresses are issued by the ZKRail checkout API (the liquidity-provider side). Set VITE_ZKRAIL_API_URL to issue them; nothing is generated in the browser.'}
            </div>
          )}
        </section>
      </div>

      <div className="dash-grid-detail">
        <section className="dash-panel">
          <PanelHead eyebrow="Settlement on Robinhood Chain" title={c.settlement ? 'Payout received' : open ? 'Watching for the payout' : 'No payout matched'} />
          {c.settlement ? (
            <>
              <div className="dash-kvs">
                <KV k="Amount received">
                  <span className="num">
                    {fmtToken(BigInt(c.settlement.value), c.decimals)} {c.symbol}
                  </span>
                </KV>
                <KV k="Transaction">
                  <TxLink hash={c.settlement.txHash} />
                </KV>
                <KV k="Block">
                  <span className="num">{Number(c.settlement.block).toLocaleString()}</span>
                </KV>
                <KV k="Settled at">
                  <span className="num">{fmtDateTime(c.settlement.timestamp * 1000)}</span>
                </KV>
                <KV k="Paid by">
                  <AddressLink address={c.settlement.from} />
                </KV>
                <KV k="Matched">
                  <span>{c.settlement.matchedBy === 'auto' ? 'Automatically, exact amount' : 'Attached by you'}</span>
                </KV>
              </div>
              {c.late ? <p className="dash-note">This payout arrived after the quote expired. The rate you locked no longer applied at that moment.</p> : null}
              {c.status === 'partial' ? <p className="dash-alert">Received less than the payout amount. Follow up with the customer or refund.</p> : null}
              <div className="dash-actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.removeSettlement(c.id)}>
                  Detach this transfer
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={downloadReceipt}>
                  Download receipt
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="dash-muted">
                Looking for a transfer of exactly{' '}
                <strong className="num">
                  {fmtToken(c.payoutUnits, c.decimals)} {c.symbol}
                </strong>{' '}
                to <AddressLink address={c.settlementAddress} /> from block {Number(c.createdBlock).toLocaleString()} onward.
              </p>
              <p className="dash-scan num">
                <span className={`dash-spinner${scanning ? '' : ' is-idle'}`} aria-hidden="true" />
                {head !== null ? `Chain read up to block ${Number(head).toLocaleString()}` : 'Reading chain...'}
              </p>
              <p className="dash-note">
                A different amount will not match automatically. If the customer's payout arrived with another amount, open it in{' '}
                <Link to="/app/verify">Verify transaction</Link> and attach it here.
              </p>
              <div className="dash-actions">
                {open ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.patchCheckout(c.id, { cancelledAt: Date.now() })}>
                    Cancel checkout
                  </button>
                ) : null}
                {c.status === 'cancelled' ? (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => actions.patchCheckout(c.id, { cancelledAt: undefined })}>
                    Reopen
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>

        <section className="dash-panel">
          <PanelHead eyebrow="Payment link" title="Send this to the customer" />
          <div className="dash-shielded">
            {linkQr ? <img className="dash-qr" src={linkQr} alt="QR code of the payment link" /> : null}
            <div className="dash-shielded-body">
              <p className="num dash-break dash-link-box">{link}</p>
              <div className="dash-actions">
                <CopyButton value={link} label="Copy link" />
                <a className="btn btn--ghost btn--sm" href={link} target="_blank" rel="noopener noreferrer">
                  Open
                  <IconArrowUpRight size={12} />
                </a>
              </div>
              <p className="dash-note">
                The customer page shows the quote and countdown and reads settlement status from Robinhood Chain itself.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="dash-panel">
        <PanelHead eyebrow="Privacy model" title="Who can see what, for this checkout" />
        <div className="dash-privacy">
          <div className="dash-privacy-col dash-privacy-col--shield">
            <p className="chip chip--shield">Shielded</p>
            <ul>
              <li>Customer's Zcash address</li>
              <li>
                The {c.zec.amount} ZEC they send, on Zcash
              </li>
              <li>Memo field ({c.orderRef})</li>
            </ul>
          </div>
          <div className="dash-privacy-col dash-privacy-col--settle">
            <p className="chip chip--settle">Public on Robinhood Chain</p>
            <ul>
              <li>
                {fmtToken(c.payoutUnits, c.decimals)} {c.symbol} payout
              </li>
              <li>Your address {shortAddr(c.settlementAddress)}</li>
              <li>{c.settlement ? `Tx ${shortAddr(c.settlement.txHash, 8, 6)}` : 'The settlement tx, once sent'}</li>
              <li>{c.settlement ? `Provider ${shortAddr(c.settlement.from)}` : "The provider's address"}</li>
            </ul>
          </div>
          <div className="dash-privacy-col dash-privacy-col--signal">
            <p className="chip chip--signal">Provider sees</p>
            <ul>
              <li>That this ZEC payment funded this payout</li>
              <li>The {formatUsd(c.zec.rate)} USD rate applied</li>
              <li>Payment timing</li>
              <li>{merchantName || 'Your store'} as the merchant</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="dash-panel">
        <PanelHead
          eyebrow="Webhook"
          title={`Event for this status: ${JSON.parse(body).event}`}
          action={<CopyButton value={body} label="Copy body" />}
        />
        <pre className="dash-code">
          <code>{body}</code>
        </pre>
        <div className="dash-inline">
          <span className="mock-label">x-zkrail-signature</span>
          <span className="num dash-break">{signature || '...'}</span>
          {signature ? <CopyButton value={signature} compact /> : null}
        </div>
        <details className="dash-details">
          <summary>Replay against your server with curl</summary>
          <pre className="dash-code">
            <code>{curl}</code>
          </pre>
          <CopyButton value={curl} label="Copy curl" />
          {!webhookUrl ? (
            <p className="dash-note">
              No webhook URL saved yet. <Link to="/app/settings">Add one in Settings</Link> ({tokenSymbol} payouts are signed with your secret).
            </p>
          ) : null}
        </details>
      </section>
    </>
  );
}
