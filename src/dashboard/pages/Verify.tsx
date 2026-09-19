import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { decodeEventLog, erc20Abi, parseAbiItem, type Address, type Hash } from 'viem';
import { useCheckoutViews, useMerchant } from '../merchant';
import { rpc, withBackoff } from '../lib/rpc';
import { fmtDateTime, fmtToken, shortAddr } from '../lib/format';
import { tokenByAddress, explorerTx } from '../config';
import { AddressLink, Empty, KV, PageHead, PanelHead, TxLink } from '../ui';
import { IconArrowUpRight } from '../../components/ui/Icons';

const TRANSFER = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

type Decoded = { token: Address; symbol: string; decimals: number; from: Address; to: Address; value: bigint; logIndex: number };
type Result = {
  hash: Hash;
  status: 'success' | 'reverted';
  block: bigint;
  timestamp: number;
  from: Address;
  to: Address | null;
  gasUsed: bigint;
  confirmations: bigint;
  transfers: Decoded[];
};

async function tokenMeta(address: Address) {
  const known = tokenByAddress(address);
  if (known) return { symbol: known.symbol, decimals: known.decimals };
  try {
    const [symbol, decimals] = await Promise.all([
      rpc.readContract({ address, abi: erc20Abi, functionName: 'symbol' }),
      rpc.readContract({ address, abi: erc20Abi, functionName: 'decimals' }),
    ]);
    return { symbol, decimals };
  } catch {
    return { symbol: shortAddr(address), decimals: 18 };
  }
}

async function inspect(hash: Hash): Promise<Result> {
  const [receipt, tx, latest] = await Promise.all([
    withBackoff(() => rpc.getTransactionReceipt({ hash })),
    withBackoff(() => rpc.getTransaction({ hash })),
    withBackoff(() => rpc.getBlockNumber()),
  ]);
  const block = await withBackoff(() => rpc.getBlock({ blockNumber: receipt.blockNumber }));
  const raw = receipt.logs.flatMap((log) => {
    try {
      const d = decodeEventLog({ abi: [TRANSFER], data: log.data, topics: log.topics });
      return [{ token: log.address, logIndex: log.logIndex, ...(d.args as { from: Address; to: Address; value: bigint }) }];
    } catch {
      return [];
    }
  });
  const metas = await Promise.all([...new Set(raw.map((r) => r.token.toLowerCase()))].map(async (a) => [a, await tokenMeta(a as Address)] as const));
  const metaMap = new Map(metas);
  return {
    hash,
    status: receipt.status,
    block: receipt.blockNumber,
    timestamp: Number(block.timestamp),
    from: tx.from,
    to: tx.to,
    gasUsed: receipt.gasUsed,
    confirmations: latest - receipt.blockNumber + 1n,
    transfers: raw.map((r) => ({ ...r, ...(metaMap.get(r.token.toLowerCase()) ?? { symbol: '?', decimals: 18 }) })),
  };
}

export function Verify() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('tx') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const { settlementAddress, token, ledger, actions } = useMerchant();
  const views = useCheckoutViews();
  const [attachTo, setAttachTo] = useState('');
  const [attached, setAttached] = useState<string | null>(null);

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    const hash = input.trim();
    if (!HASH_RE.test(hash)) {
      setError('A transaction hash is 0x followed by 64 hex characters.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setAttached(null);
    setParams({ tx: hash }, { replace: true });
    try {
      setResult(await inspect(hash as Hash));
    } catch (err) {
      const msg = err instanceof Error ? err.message.split('\n')[0] : String(err);
      setError(/could not be found|not found/i.test(msg) ? 'No transaction with this hash on Robinhood Chain (mainnet, 4663).' : msg);
    } finally {
      setBusy(false);
    }
  };

  const toMe = result?.transfers.filter(
    (t) => t.to.toLowerCase() === settlementAddress.toLowerCase() && t.token.toLowerCase() === token.address.toLowerCase(),
  );
  const alreadyUsed = new Set(ledger.checkouts.flatMap((c) => (c.settlement ? [`${c.settlement.txHash}:${c.settlement.logIndex}`] : [])));
  // Only checkouts that existed when this transaction was mined can be settled by it.
  const candidates = views.filter((v) => !v.settlement && v.status !== 'cancelled' && (!result || BigInt(v.createdBlock) <= result.block));

  const attach = (t: Decoded) => {
    if (!result || !attachTo) return;
    actions.patchCheckout(attachTo, {
      settlement: {
        txHash: result.hash,
        logIndex: t.logIndex,
        block: result.block.toString(),
        value: t.value.toString(),
        from: t.from,
        timestamp: result.timestamp,
        matchedBy: 'manual',
      },
    });
    setAttached(attachTo);
  };

  return (
    <>
      <PageHead
        index="04"
        title="Verify transaction"
        lede="Check any Robinhood Chain transaction: status, block, and every token transfer inside it. Payouts to you can be attached to a checkout."
      />

      <form className="dash-panel dash-verify-form" onSubmit={run}>
        <label className="dash-field dash-grow">
          <span className="access-label">Transaction hash</span>
          <input className="dash-input num" placeholder="0x..." value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" />
        </label>
        <button type="submit" className="btn btn--ink" disabled={busy}>
          {busy ? 'Reading chain...' : 'Verify'}
        </button>
      </form>

      {error ? (
        <p className="dash-alert" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <section className="dash-panel">
            <PanelHead
              eyebrow="Receipt"
              title={result.status === 'success' ? 'Confirmed' : 'Reverted'}
              action={
                <a className="btn btn--ghost btn--sm" href={explorerTx(result.hash)} target="_blank" rel="noopener noreferrer">
                  Blockscout <IconArrowUpRight size={12} />
                </a>
              }
            />
            <div className="dash-kvs dash-kvs--2">
              <KV k="Hash">
                <TxLink hash={result.hash} />
              </KV>
              <KV k="Status">
                <span className={`chip ${result.status === 'success' ? 'chip--settle' : 'dash-status--alert'}`}>{result.status}</span>
              </KV>
              <KV k="Block">
                <span className="num">{Number(result.block).toLocaleString()}</span>
              </KV>
              <KV k="Time">
                <span className="num">{fmtDateTime(result.timestamp * 1000)}</span>
              </KV>
              <KV k="Confirmations">
                <span className="num">{Number(result.confirmations).toLocaleString()}</span>
              </KV>
              <KV k="Gas used">
                <span className="num">{Number(result.gasUsed).toLocaleString()}</span>
              </KV>
              <KV k="Sender">
                <AddressLink address={result.from} />
              </KV>
              <KV k="Contract / to">{result.to ? <AddressLink address={result.to} /> : <span>Contract creation</span>}</KV>
            </div>
          </section>

          <section className="dash-panel">
            <PanelHead eyebrow="Token transfers" title={`${result.transfers.length} in this transaction`} />
            {result.transfers.length === 0 ? (
              <Empty title="No ERC-20 transfers" body="This transaction did not move any tokens." />
            ) : (
              <ul className="dash-rows">
                {result.transfers.map((t) => {
                  const mine = t.to.toLowerCase() === settlementAddress.toLowerCase();
                  return (
                    <li key={t.logIndex} className={`dash-row dash-row--static${mine ? ' is-mine' : ''}`}>
                      <span className="dash-row-main">
                        <span className="dash-row-title num">
                          {fmtToken(t.value, t.decimals, true)} {t.symbol}
                        </span>
                        <span className="dash-row-sub num">
                          {shortAddr(t.from)} to {shortAddr(t.to)}
                        </span>
                      </span>
                      {mine ? <span className="chip chip--settle">To your settlement address</span> : <span className="chip">Not to you</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {toMe && toMe.length ? (
            <section className="dash-panel">
              <PanelHead eyebrow="Reconcile" title="Attach this payout to a checkout" />
              {toMe.map((t) => {
                const used = alreadyUsed.has(`${result.hash}:${t.logIndex}`);
                return (
                  <div key={t.logIndex} className="dash-attach-row">
                    <span className="num">
                      {fmtToken(t.value, t.decimals, true)} {t.symbol}
                    </span>
                    {used ? (
                      <span className="chip chip--settle">Already settles a checkout</span>
                    ) : attached ? (
                      <Link to={`/app/checkouts/${attached}`} className="chip chip--settle">
                        Attached. Open checkout
                      </Link>
                    ) : candidates.length ? (
                      <span className="dash-attach">
                        <select className="dash-input dash-input--sm" value={attachTo} onChange={(e) => setAttachTo(e.target.value)} aria-label="Checkout">
                          <option value="">Choose checkout...</option>
                          {candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.orderRef} ({c.payout} {c.symbol})
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn btn--ink btn--sm" disabled={!attachTo} onClick={() => attach(t)}>
                          Attach
                        </button>
                      </span>
                    ) : (
                      <span className="dash-muted">No open checkout was created before this transaction.</span>
                    )}
                  </div>
                );
              })}
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
