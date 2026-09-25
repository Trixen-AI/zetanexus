import { useState } from 'react';
import { Link } from 'react-router';
import { useCheckoutViews, useMerchant } from '../merchant';
import { BLOCKS_PER_DAY } from '../config';
import { fmtDateTime, fmtRelative, fmtToken, shortAddr } from '../lib/format';
import { checkoutForTransfer } from '../lib/reconcile';
import type { Transfer } from '../lib/transfers';
import { AddressLink, Empty, PageHead, TxLink } from '../ui';

export function Settlements() {
  const { ledger, actions, settlementAddress, token, transfers } = useMerchant();
  const views = useCheckoutViews();
  const settledBy = checkoutForTransfer(ledger.checkouts);
  const attachable = views.filter((v) => !v.settlement && v.status !== 'cancelled');

  let total = 0n;
  let unmatched = 0;
  for (const t of transfers.transfers) {
    total += t.value;
    if (!settledBy.has(t.id)) unmatched += 1;
  }

  const coveredDays =
    transfers.floor !== null && transfers.head !== null ? Math.round(Number(transfers.head - transfers.floor) / BLOCKS_PER_DAY) : null;

  const exportCsv = () => {
    const rows = transfers.transfers.map((t) =>
      [
        t.timestamp ? new Date(t.timestamp * 1000).toISOString() : '',
        t.block.toString(),
        t.txHash,
        t.from,
        fmtToken(t.value, token.decimals, true).replace(/,/g, ''),
        token.symbol,
        settledBy.get(t.id)?.orderRef ?? '',
      ].join(','),
    );
    const csv = ['timestamp,block,tx_hash,from,amount,asset,order_ref', ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `zrail-settlements-${Date.now()}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead
        index="03"
        title="Settlements"
        lede={`Every ${token.symbol} transfer into your settlement address on Robinhood Chain, read directly from the chain.`}
        action={
          <div className="dash-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => void transfers.index?.sync()} disabled={transfers.syncing}>
              {transfers.syncing ? 'Syncing...' : 'Refresh'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={!transfers.transfers.length}>
              Export CSV
            </button>
          </div>
        }
      />

      <section className="dash-stats dash-stats--3">
        <article className="dash-stat">
          <p className="mock-label">Received in window</p>
          <p className="dash-stat-value num">
            {fmtToken(total, token.decimals)}
            <span className="dash-stat-unit">{token.symbol}</span>
          </p>
          <p className="dash-stat-note">
            {transfers.transfers.length} transfer{transfers.transfers.length === 1 ? '' : 's'}
            {coveredDays !== null ? ` · last ${coveredDays} days` : ''}
          </p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">Matched to checkouts</p>
          <p className="dash-stat-value num">{transfers.transfers.length - unmatched}</p>
          <p className="dash-stat-note">{unmatched} without a checkout</p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">Chain read up to</p>
          <p className="dash-stat-value num">{transfers.head !== null ? Number(transfers.head).toLocaleString() : '...'}</p>
          <p className="dash-stat-note">
            {transfers.lastSyncAt ? `synced ${fmtRelative(transfers.lastSyncAt)}` : 'first sync running'} · <AddressLink address={settlementAddress} />
          </p>
        </article>
      </section>

      {transfers.error ? (
        <p className="dash-alert" role="alert">
          Robinhood Chain RPC: {transfers.error}. Retrying on the next sync.
        </p>
      ) : null}

      <section className="dash-panel dash-panel--flush">
        {transfers.transfers.length === 0 ? (
          <Empty
            title={transfers.head === null ? 'Reading Robinhood Chain...' : `No ${token.symbol} received in this window`}
            body={
              <>
                Payouts to <span className="num">{shortAddr(settlementAddress)}</span> appear here within seconds of landing.
              </>
            }
          />
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th className="is-num">Amount</th>
                  <th>From</th>
                  <th>Transaction</th>
                  <th>Checkout</th>
                </tr>
              </thead>
              <tbody>
                {transfers.transfers.map((t) => (
                  <Row key={t.id} t={t} decimals={token.decimals} symbol={token.symbol} settled={settledBy.get(t.id)} attachable={attachable} onAttach={(checkoutId) =>
                    actions.patchCheckout(checkoutId, {
                      settlement: {
                        txHash: t.txHash,
                        logIndex: t.logIndex,
                        block: t.block.toString(),
                        value: t.value.toString(),
                        from: t.from,
                        timestamp: t.timestamp ?? Math.floor(Date.now() / 1000),
                        matchedBy: 'manual',
                      },
                    })
                  } />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="dash-table-foot">
          <span className="dash-muted num">
            {transfers.floor !== null ? `History from block ${Number(transfers.floor).toLocaleString()}` : ''}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={transfers.loadingOlder || transfers.floor === null} onClick={() => void transfers.index?.loadOlder()}>
            {transfers.loadingOlder ? 'Reading older blocks...' : 'Load 7 more days'}
          </button>
        </footer>
      </section>
    </>
  );
}

type RowProps = {
  t: Transfer;
  decimals: number;
  symbol: string;
  settled?: { id: string; orderRef: string };
  attachable: { id: string; orderRef: string; payout: string; createdBlock: string }[];
  onAttach: (checkoutId: string) => void;
};

function Row({ t, decimals, symbol, settled, attachable: all, onAttach }: RowProps) {
  const [pick, setPick] = useState('');
  // A payout that landed before a checkout existed cannot be that checkout's settlement.
  const attachable = all.filter((c) => BigInt(c.createdBlock) <= t.block);
  return (
    <tr>
      <td className="num">{t.timestamp ? fmtDateTime(t.timestamp * 1000) : `block ${t.block}`}</td>
      <td className="is-num num">
        +{fmtToken(t.value, decimals, true)} {symbol}
      </td>
      <td>
        <AddressLink address={t.from} />
      </td>
      <td>
        <TxLink hash={t.txHash} />
      </td>
      <td>
        {settled ? (
          <Link to={`/app/checkouts/${settled.id}`} className="chip chip--settle">
            {settled.orderRef}
          </Link>
        ) : attachable.length ? (
          <span className="dash-attach">
            <select className="dash-input dash-input--sm" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Attach to checkout">
              <option value="">Attach to...</option>
              {attachable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.orderRef} ({c.payout})
                </option>
              ))}
            </select>
            <button type="button" className="btn btn--ghost btn--sm" disabled={!pick} onClick={() => onAttach(pick)}>
              Attach
            </button>
          </span>
        ) : (
          <span className="dash-muted">Unmatched</span>
        )}
      </td>
    </tr>
  );
}
