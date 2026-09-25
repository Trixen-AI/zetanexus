import { useState } from 'react';
import { erc20Abi, parseUnits, type Address } from 'viem';
import { useBalance, useReadContract } from 'wagmi';
import { useMerchant } from '../merchant';
import { CHAIN_ID } from '../config';
import { useIncomingTransfers } from '../lib/transfers';
import { useApproval } from '../lib/approve';
import { fmtDateTime, fmtEth, fmtToken, shortAddr } from '../lib/format';
import { AddressLink, Empty, KV, PageHead, PanelHead, TxLink } from '../ui';
import { CONTRACTS, TOKEN, ZZEC, RULE } from '../../data/site';
import { useZzecBacking } from '../../lib/chain';
import { formatUsd, useZecPrice } from '../../lib/zecPrice';

const ZZEC_ADDR = ZZEC.token as Address;
const DESK = ZZEC.redemptionDesk as Address;
const DESK_MIN = 0.001;
const DISTRIBUTOR = CONTRACTS.distributor.trim().toLowerCase();
const THRESHOLD_USD = Number(RULE.terms[0].value.replace(/[^0-9.]/g, ''));

/** Approve zZEC to ZEAL's redemption desk: a real transaction that works today. */
function RedeemPanel() {
  const [amount, setAmount] = useState('');
  const valid = /^\d+(\.\d{1,8})?$/.test(amount) && Number(amount) >= DESK_MIN;
  const units = valid ? parseUnits(amount, ZZEC.decimals) : 0n;
  const a = useApproval(ZZEC_ADDR, DESK, units);
  const max = () => setAmount((Number(a.balance) / 10 ** ZZEC.decimals).toFixed(ZZEC.decimals).replace(/\.?0+$/, ''));

  const label =
    a.stage === 'switch'
      ? 'Switch to Robinhood Chain'
      : a.stage === 'signing'
        ? 'Confirm in your wallet...'
        : a.stage === 'pending'
          ? 'Approving...'
          : a.alreadyApproved || a.stage === 'done'
            ? 'Approved'
            : 'Approve zZEC';

  return (
    <section className="dash-panel">
      <PanelHead eyebrow="Redeem" title="Turn zZEC back into ZEC" />
      <p className="dash-muted">
        ZEAL's redemption desk swaps zZEC for native ZEC. Approve the amount here; the desk takes it when you file the redemption with
        your Zcash address.
      </p>
      <label className="dash-field">
        <span className="access-label">Amount (zZEC)</span>
        <div className="dash-input-affix">
          <input
            className="dash-input num"
            inputMode="decimal"
            placeholder={`min ${DESK_MIN}`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(',', '.'));
              a.reset();
            }}
            aria-invalid={amount !== '' && !valid}
          />
          <span className="num">zZEC</span>
        </div>
        <span className="dash-field-hint">
          Balance {a.balanceLoaded ? fmtToken(a.balance, ZZEC.decimals, true) : '...'} zZEC ·{' '}
          <button type="button" className="dash-inline-btn" onClick={max} disabled={!a.balance}>
            Use max
          </button>
        </span>
        {amount !== '' && !valid ? <span className="dash-field-error">At least {DESK_MIN} zZEC, up to 8 decimals.</span> : null}
        {valid && !a.enough ? <span className="dash-field-error">More than this wallet holds.</span> : null}
      </label>
      <div className="dash-kvs">
        <KV k="Spender">
          <AddressLink address={DESK} label={`ZEAL redemption desk ${shortAddr(DESK)}`} />
        </KV>
        <KV k="Current allowance">
          <span className="num">{fmtToken(a.allowance, ZZEC.decimals, true)} zZEC</span>
        </KV>
      </div>
      <div className="dash-actions">
        <button
          type="button"
          className="btn btn--brand"
          onClick={a.approve}
          disabled={!valid || !a.enough || a.stage === 'signing' || a.stage === 'pending' || a.alreadyApproved}
        >
          {label}
        </button>
        {a.txHash ? <TxLink hash={a.txHash} /> : null}
      </div>
      {a.stage === 'error' && a.error ? <p className="dash-alert">{a.error}</p> : null}
    </section>
  );
}

/** Where this wallet stands against the payout rule. */
function RulePanel({ zkrailUsd }: { zkrailUsd: number | null }) {
  const [held, setHeld] = useState('');
  const value = zkrailUsd ?? (held === '' ? null : Number(held));
  const ok = value !== null && value >= THRESHOLD_USD;
  return (
    <section className="dash-panel">
      <PanelHead eyebrow="The rule" title={`${RULE.terms[0].value} of $${TOKEN.symbol} to qualify`} />
      {zkrailUsd === null ? (
        <label className="dash-field">
          <span className="access-label">Your ${TOKEN.symbol} holding (USD)</span>
          <input className="dash-input num" inputMode="decimal" placeholder="e.g. 250" value={held} onChange={(e) => setHeld(e.target.value.replace(/[^0-9.]/g, ''))} />
        </label>
      ) : null}
      <div className={`dash-rule-verdict${value === null ? '' : ok ? ' is-ok' : ' is-short'}`}>
        {value === null
          ? `Enter a holding to see where it lands against ${RULE.terms[0].value}.`
          : ok
            ? `$${formatUsd(value)} qualifies. Keep it for 15 minutes and payouts arrive on their own.`
            : `$${formatUsd(value)} is $${formatUsd(THRESHOLD_USD - value)} short of the threshold.`}
      </div>
      <div className="dash-kvs">
        {RULE.terms.map((t) => (
          <KV key={t.label} k={t.label}>
            <span className="num">
              {t.value} · {t.note}
            </span>
          </KV>
        ))}
      </div>
    </section>
  );
}

/**
 * Holder earnings for the connected wallet, read from Robinhood Chain: zZEC
 * balance, every zZEC transfer into the wallet, and (once the token contract is
 * set in src/data/site.ts) the $ZKRAIL balance. Redemption approval works today.
 */
export function Earn() {
  const { wallet } = useMerchant();
  const price = useZecPrice();
  const backing = useZzecBacking();
  const token = TOKEN.contract as Address | '';

  const zzecBal = useReadContract({
    address: ZZEC_ADDR,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet],
    chainId: CHAIN_ID,
    query: { refetchInterval: 20_000 },
  });
  const tokenBal = useReadContract({
    address: (token || ZZEC_ADDR) as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [wallet],
    chainId: CHAIN_ID,
    query: { enabled: !!token, refetchInterval: 20_000 },
  });
  const gas = useBalance({ address: wallet, chainId: CHAIN_ID, query: { refetchInterval: 30_000 } });

  const incoming = useIncomingTransfers(ZZEC_ADDR, wallet, 20_000);
  const payouts = incoming.transfers.filter((t) => !DISTRIBUTOR || t.from.toLowerCase() === DISTRIBUTOR);
  const totalPaid = payouts.reduce((acc, t) => acc + t.value, 0n);
  const zzecUsd = zzecBal.data !== undefined && price.usd ? (Number(zzecBal.data) / 1e8) * price.usd : null;

  return (
    <>
      <PageHead index="07" title="Earn" lede="Your zZEC as a $ZKRAIL holder: balance, payouts received, and redemption back to ZEC." />

      <section className="dash-stats">
        <article className="dash-stat dash-stat--lead">
          <p className="mock-label">zZEC in this wallet</p>
          <p className="dash-stat-value num">
            {zzecBal.data !== undefined ? fmtToken(zzecBal.data, 8, true) : zzecBal.isError ? 'n/a' : '...'}
            <span className="dash-stat-unit">zZEC</span>
          </p>
          <p className="dash-stat-note">{zzecUsd !== null ? `about $${formatUsd(zzecUsd)} at the live ZEC price` : 'Valued at the live ZEC price'}</p>
        </article>
        <article className="dash-stat">
          <p className="mock-label">zZEC received</p>
          <p className="dash-stat-value num">
            {fmtToken(totalPaid, 8, true)}
            <span className="dash-stat-unit">zZEC</span>
          </p>
          <p className="dash-stat-note">
            {payouts.length} transfer{payouts.length === 1 ? '' : 's'} in the window
          </p>
        </article>
        {token ? (
          <article className="dash-stat">
            <p className="mock-label">${TOKEN.symbol} held</p>
            <p className="dash-stat-value num">{tokenBal.data !== undefined ? fmtToken(tokenBal.data, 18) : '...'}</p>
            <p className="dash-stat-note">Threshold {RULE.terms[0].value}</p>
          </article>
        ) : (
          <article className="dash-stat">
            <p className="mock-label">Gas on Robinhood Chain</p>
            <p className="dash-stat-value num">
              {gas.data ? fmtEth(gas.data.value) : '...'}
              <span className="dash-stat-unit">ETH</span>
            </p>
            <p className="dash-stat-note">For approvals and redemptions</p>
          </article>
        )}
        <article className="dash-stat">
          <p className="mock-label">zZEC backing</p>
          <p className="dash-stat-value num">
            {backing.reserve !== null && backing.owed ? `${((backing.reserve / backing.owed) * 100).toFixed(1)}%` : '...'}
          </p>
          <p className="dash-stat-note">Reserve read live</p>
        </article>
      </section>

      <div className="dash-grid-2">
        <RedeemPanel />
        <RulePanel zkrailUsd={null} />
      </div>

      <section className="dash-panel dash-panel--flush">
        {payouts.length === 0 ? (
          <Empty
            title={incoming.head === null ? 'Reading Robinhood Chain...' : 'No zZEC received in this window'}
            body={
              <>
                Watching zZEC transfers to <span className="num">{shortAddr(wallet)}</span>. Load older days to look further back.
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
                </tr>
              </thead>
              <tbody>
                {payouts.map((t) => (
                  <tr key={t.id}>
                    <td className="num">{t.timestamp ? fmtDateTime(t.timestamp * 1000) : `block ${t.block}`}</td>
                    <td className="is-num num">+{fmtToken(t.value, 8, true)} zZEC</td>
                    <td>
                      <AddressLink address={t.from} />
                    </td>
                    <td>
                      <TxLink hash={t.txHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="dash-table-foot">
          <span className="dash-muted num">{incoming.floor !== null ? `History from block ${Number(incoming.floor).toLocaleString()}` : ''}</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={incoming.loadingOlder || incoming.floor === null} onClick={() => void incoming.index?.loadOlder()}>
            {incoming.loadingOlder ? 'Reading older blocks...' : 'Load 7 more days'}
          </button>
        </footer>
      </section>
    </>
  );
}
