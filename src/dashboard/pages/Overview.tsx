import { Link } from 'react-router';
import { erc20Abi } from 'viem';
import { useBalance, useReadContract } from 'wagmi';
import { CHAIN_ID } from '../config';
import { useCheckoutViews, useMerchant } from '../merchant';
import { apiConfigured } from '../lib/api';
import { fmtDateTime, fmtEth, fmtRelative, fmtToken, shortAddr } from '../lib/format';
import { checkoutForTransfer } from '../lib/reconcile';
import { AddressLink, CopyButton, Empty, PageHead, PanelHead, StatusChip, TxLink } from '../ui';
import { formatUsd, useZecPrice, zecFor, formatZec } from '../../lib/zecPrice';
import { IconArrowRight, IconCheck } from '../../components/ui/Icons';

export function Overview() {
  const { ledger, settlementAddress, token, transfers } = useMerchant();
  const views = useCheckoutViews();
  const price = useZecPrice();

  const tokenBal = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [settlementAddress],
    chainId: CHAIN_ID,
    query: { refetchInterval: 15_000 },
  });
  const gas = useBalance({ address: settlementAddress, chainId: CHAIN_ID, query: { refetchInterval: 30_000 } });

  const weekAgo = Date.now() / 1000 - 7 * 86400;
  let received7d = 0n;
  let count7d = 0;
  for (const t of transfers.transfers) {
    if (t.timestamp !== null && t.timestamp >= weekAgo) {
      received7d += t.value;
      count7d += 1;
    }
  }

  const counts = { awaiting_payment: 0, settled: 0, partial: 0, expired: 0, cancelled: 0 };
  let settledVolume = 0n;
  for (const v of views) {
    counts[v.status] += 1;
    if (v.settlement) settledVolume += BigInt(v.settlement.value);
  }

  const bySettlement = checkoutForTransfer(ledger.checkouts);
  const name = ledger.profile.merchantName;

  const checklist = [
    { done: !!name, label: 'Name your store', to: '/app/settings' },
    { done: !!ledger.profile.webhookUrl, label: 'Add a webhook URL', to: '/app/settings' },
    { done: views.length > 0, label: 'Create your first checkout', to: '/app/checkouts/new' },
    { done: counts.settled > 0, label: 'Receive a settlement on Robinhood Chain', to: '/app/settlements' },
    { done: apiConfigured(), label: 'Connect the ZetaNexus checkout API', to: '/app/developers' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <>
      <PageHead
        index="01"
        title={name ? `${name}` : 'Overview'}
        lede="Payouts, open checkouts and the live ZEC rate for your settlement address."
        action={
          <Link to="/app/checkouts/new" className="btn btn--ink">
            New checkout
            <IconArrowRight size={15} />
          </Link>
        }
      />

      <section className="dash-stats">
        <article className="dash-stat dash-stat--lead">
          <p className="mock-label">Settlement balance</p>
          <p className="dash-stat-value num">
            {tokenBal.data !== undefined ? fmtToken(tokenBal.data, token.decimals) : tokenBal.isError ? 'n/a' : '...'}
            <span className="dash-stat-unit">{token.symbol}</span>
          </p>
          <p className="dash-stat-note">
            <AddressLink address={settlementAddress} /> · gas {gas.data ? `${fmtEth(gas.data.value)} ETH` : '...'}
          </p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">Received, last 7 days</p>
          <p className="dash-stat-value num">
            {fmtToken(received7d, token.decimals)}
            <span className="dash-stat-unit">{token.symbol}</span>
          </p>
          <p className="dash-stat-note">
            {transfers.head === null ? 'Reading chain...' : `${count7d} incoming transfer${count7d === 1 ? '' : 's'}`}
          </p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">Open checkouts</p>
          <p className="dash-stat-value num">{counts.awaiting_payment}</p>
          <p className="dash-stat-note">
            {counts.settled} settled · {counts.expired} expired
          </p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">ZEC / USD</p>
          <p className="dash-stat-value num">{price.usd ? `$${formatUsd(price.usd)}` : '...'}</p>
          <p className="dash-stat-note">
            {price.change24h !== null ? (
              <span className={price.change24h >= 0 ? 'dash-up' : 'dash-down'}>
                {price.change24h >= 0 ? '+' : ''}
                {price.change24h.toFixed(2)}% 24h
              </span>
            ) : (
              price.source ?? 'Fetching'
            )}
            {price.usd ? ` · $100 = ${formatZec(zecFor(100, price) ?? 0)} ZEC` : ''}
          </p>
        </article>
      </section>

      <div className="dash-grid-2">
        <section className="dash-panel">
          <PanelHead
            eyebrow="Checkouts"
            title="Recent checkouts"
            action={
              <Link to="/app/checkouts" className="dash-more">
                All checkouts <IconArrowRight size={13} />
              </Link>
            }
          />
          {views.length === 0 ? (
            <Empty
              title="No checkouts yet"
              body="A checkout locks a ZEC quote for a payout amount and watches your settlement address for the payout."
              action={
                <Link to="/app/checkouts/new" className="btn btn--ink btn--sm">
                  Create checkout
                </Link>
              }
            />
          ) : (
            <ul className="dash-rows">
              {views.slice(0, 6).map((v) => (
                <li key={v.id}>
                  <Link to={`/app/checkouts/${v.id}`} className="dash-row">
                    <span className="dash-row-main">
                      <span className="dash-row-title">{v.orderRef}</span>
                      <span className="dash-row-sub num">{fmtRelative(v.createdAt)}</span>
                    </span>
                    <span className="num dash-row-amount">
                      {fmtToken(v.payoutUnits, v.decimals)} {v.symbol}
                    </span>
                    <StatusChip status={v.status} late={v.late} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-panel">
          <PanelHead
            eyebrow="On-chain"
            title="Latest payouts received"
            action={
              <Link to="/app/settlements" className="dash-more">
                All settlements <IconArrowRight size={13} />
              </Link>
            }
          />
          {transfers.transfers.length === 0 ? (
            <Empty
              title={transfers.head === null ? 'Reading Robinhood Chain...' : 'No incoming payouts in the last 7 days'}
              body={
                <>
                  Watching {token.symbol} transfers to <span className="num">{shortAddr(settlementAddress)}</span>
                  {transfers.error ? ` · ${transfers.error}` : '.'}
                </>
              }
            />
          ) : (
            <ul className="dash-rows">
              {transfers.transfers.slice(0, 6).map((t) => {
                const c = bySettlement.get(t.id);
                return (
                  <li key={t.id} className="dash-row dash-row--static">
                    <span className="dash-row-main">
                      <span className="dash-row-title num">
                        +{fmtToken(t.value, token.decimals)} {token.symbol}
                      </span>
                      <span className="dash-row-sub num">
                        {t.timestamp ? fmtDateTime(t.timestamp * 1000) : `block ${t.block}`} · from {shortAddr(t.from)}
                      </span>
                    </span>
                    <TxLink hash={t.txHash} />
                    {c ? (
                      <Link to={`/app/checkouts/${c.id}`} className="chip chip--settle">
                        {c.orderRef}
                      </Link>
                    ) : (
                      <span className="chip">Unmatched</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="dash-grid-2">
        <section className="dash-panel">
          <PanelHead eyebrow="Setup" title={`${doneCount} of ${checklist.length} done`} />
          <ol className="dash-checklist">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? 'is-done' : ''}>
                <span className="dash-check" aria-hidden="true">
                  {item.done ? <IconCheck size={12} /> : null}
                </span>
                {item.done ? (
                  <span>{item.label}</span>
                ) : (
                  <Link to={item.to} className="dash-checklist-link">
                    {item.label}
                    <IconArrowRight size={12} />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="dash-panel">
          <PanelHead eyebrow="Settled through ZetaNexus" title="Checkout volume" />
          <p className="dash-big num">
            {fmtToken(settledVolume, token.decimals)} <span className="dash-stat-unit">{token.symbol}</span>
          </p>
          <p className="dash-muted">
            Sum of payouts matched to your checkouts. Transfers that arrived without a checkout are listed in Settlements and are
            not counted here.
          </p>
          <div className="dash-inline">
            <span className="mock-label">Settlement address</span>
            <span className="num">{shortAddr(settlementAddress, 10, 8)}</span>
            <CopyButton value={settlementAddress} compact />
          </div>
        </section>
      </div>
    </>
  );
}
