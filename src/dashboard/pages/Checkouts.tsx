import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useCheckoutViews } from '../merchant';
import { fmtDateTime, fmtRelative, fmtToken } from '../lib/format';
import { STATUS_LABEL, type CheckoutStatus, type CheckoutView } from '../lib/reconcile';
import { Empty, PageHead, StatusChip, TxLink } from '../ui';
import { IconArrowRight } from '../../components/ui/Icons';

const FILTERS: (CheckoutStatus | 'all')[] = ['all', 'awaiting_payment', 'settled', 'partial', 'expired', 'cancelled'];

function toCsv(rows: CheckoutView[]) {
  const head = ['id', 'order_ref', 'status', 'payout', 'asset', 'zec_quoted', 'rate_usd', 'created_at', 'expires_at', 'settlement_tx', 'settled_at'];
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [
      r.apiId ?? r.id,
      r.orderRef,
      r.status,
      r.payout,
      r.symbol,
      r.zec.amount,
      String(r.zec.rate),
      new Date(r.createdAt).toISOString(),
      new Date(r.expiresAt).toISOString(),
      r.settlement?.txHash ?? '',
      r.settlement ? new Date(r.settlement.timestamp * 1000).toISOString() : '',
    ]
      .map(esc)
      .join(','),
  );
  return [head.join(','), ...lines].join('\n');
}

export function Checkouts() {
  const views = useCheckoutViews();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('status') as CheckoutStatus | 'all' | null) ?? 'all';
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());

  const counts = useMemo(() => {
    const c = new Map<string, number>([['all', views.length]]);
    views.forEach((v) => c.set(v.status, (c.get(v.status) ?? 0) + 1));
    return c;
  }, [views]);

  const rows = views.filter(
    (v) =>
      (filter === 'all' || v.status === filter) &&
      (!q || v.orderRef.toLowerCase().includes(q) || v.id.includes(q) || v.description.toLowerCase().includes(q)),
  );

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `zetanexus-checkouts-${Date.now()}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead
        index="02"
        title="Checkouts"
        lede="Every quote you have issued, with its status reconciled against payouts on Robinhood Chain."
        action={
          <Link to="/app/checkouts/new" className="btn btn--ink">
            New checkout
            <IconArrowRight size={15} />
          </Link>
        }
      />

      <div className="dash-toolbar">
        <div className="dash-tabs" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`dash-tab${filter === f ? ' is-active' : ''}`}
              onClick={() => setParams(f === 'all' ? {} : { status: f }, { replace: true })}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
              <span className="dash-tab-count num">{counts.get(f) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="dash-toolbar-right">
          <input
            className="dash-input dash-search"
            type="search"
            placeholder="Search order or id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search checkouts"
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv} disabled={!rows.length}>
            Export CSV
          </button>
        </div>
      </div>

      <section className="dash-panel dash-panel--flush">
        {rows.length === 0 ? (
          <Empty
            title={views.length ? 'Nothing matches this filter' : 'No checkouts yet'}
            body={views.length ? 'Try another status or clear the search.' : 'Create a checkout to lock a live ZEC quote for an order.'}
            action={
              views.length ? null : (
                <Link to="/app/checkouts/new" className="btn btn--ink btn--sm">
                  Create checkout
                </Link>
              )
            }
          />
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="is-num">Payout</th>
                  <th className="is-num">ZEC quoted</th>
                  <th>Created</th>
                  <th>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/app/checkouts/${v.id}`} className="dash-cell-link">
                        <span className="dash-row-title">{v.orderRef}</span>
                        <span className="dash-row-sub num">{v.apiId ?? v.id}</span>
                      </Link>
                    </td>
                    <td>
                      <StatusChip status={v.status} late={v.late} />
                    </td>
                    <td className="is-num num">
                      {fmtToken(v.payoutUnits, v.decimals)} {v.symbol}
                    </td>
                    <td className="is-num num">{v.zec.amount}</td>
                    <td className="num" title={fmtDateTime(v.createdAt)}>
                      {fmtRelative(v.createdAt)}
                    </td>
                    <td>{v.settlement ? <TxLink hash={v.settlement.txHash} /> : <span className="dash-muted">None yet</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
