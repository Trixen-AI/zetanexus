import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { isAddress } from 'viem';
import { useMerchant } from '../merchant';
import { newCheckoutId, type Checkout } from '../lib/ledger';
import { rpc, withBackoff } from '../lib/rpc';
import { apiConfigured, createRemoteCheckout } from '../lib/api';
import { shortAddr, toUnits } from '../lib/format';
import { AddressLink, KV, PageHead } from '../ui';
import { formatUsd, formatZec, priceLabel, useZecPrice } from '../../lib/zecPrice';
import { IconArrowRight, IconLock } from '../../components/ui/Icons';

const EXPIRY_OPTIONS = [15, 30, 60, 240];

function suggestOrderRef() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const tail = Array.from(crypto.getRandomValues(new Uint8Array(2)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `ZN-${ymd}-${tail.toUpperCase()}`;
}

export function NewCheckout() {
  const { ledger, actions, settlementAddress, token } = useMerchant();
  const navigate = useNavigate();
  const price = useZecPrice();

  const [orderRef, setOrderRef] = useState(suggestOrderRef);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState(ledger.profile.expiryMinutes || 15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const units = toUnits(amount, token.decimals);
  const usd = units !== null ? Number(amount) : null;
  const zec = usd !== null && price.usd ? usd / price.usd : null;
  const priceOk = price.status === 'live' && !!price.usd;
  const canSubmit = !!orderRef.trim() && units !== null && units > 0n && priceOk && isAddress(settlementAddress) && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || zec === null || !price.usd) return;
    setBusy(true);
    setError(null);
    try {
      // The block the quote was issued in: payouts before it cannot settle this checkout.
      const createdBlock = await withBackoff(() => rpc.getBlockNumber());
      const now = Date.now();
      const checkout: Checkout = {
        id: newCheckoutId(),
        orderRef: orderRef.trim(),
        description: description.trim(),
        payout: amount.trim(),
        payoutToken: token.address,
        settlementAddress,
        zec: { amount: formatZec(zec), rate: price.usd, source: price.source ?? 'unknown', quotedAt: price.updatedAt ?? now },
        createdAt: now,
        createdBlock: createdBlock.toString(),
        expiresAt: now + expiry * 60_000,
      };

      if (apiConfigured()) {
        const remote = await createRemoteCheckout({
          merchant_name: ledger.profile.merchantName || 'ZRail merchant',
          order_ref: checkout.orderRef,
          payout_amount: checkout.payout,
          payout_asset: token.symbol,
          settlement_address: settlementAddress,
          ...(ledger.profile.webhookUrl ? { webhook_url: ledger.profile.webhookUrl } : {}),
        });
        checkout.apiId = remote.id;
        checkout.shieldedAddress = remote.shielded_address;
        checkout.zec.amount = remote.zec_amount || checkout.zec.amount;
        const exp = Date.parse(remote.expires_at);
        if (Number.isFinite(exp)) checkout.expiresAt = exp;
      }

      actions.addCheckout(checkout);
      navigate(`/app/checkouts/${checkout.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the checkout');
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        index="02"
        title="New checkout"
        lede="Lock a ZEC quote for an order. The checkout settles when the payout reaches your address on Robinhood Chain."
        action={
          <Link to="/app/checkouts" className="btn btn--ghost">
            Cancel
          </Link>
        }
      />

      <div className="dash-grid-form">
        <form className="dash-panel dash-form" onSubmit={submit}>
          <label className="dash-field">
            <span className="access-label">Order reference</span>
            <input className="dash-input" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} maxLength={64} required />
          </label>

          <label className="dash-field">
            <span className="access-label">Payout amount ({token.symbol})</span>
            <div className="dash-input-affix">
              <input
                className="dash-input num"
                inputMode="decimal"
                placeholder="250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                aria-invalid={amount !== '' && units === null}
                required
              />
              <span className="num">{token.symbol}</span>
            </div>
            {amount !== '' && units === null ? (
              <span className="dash-field-error">Up to {token.decimals} decimals, digits only.</span>
            ) : null}
          </label>

          <label className="dash-field">
            <span className="access-label">Description (optional)</span>
            <input
              className="dash-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
              placeholder="What the customer is paying for"
            />
          </label>

          <fieldset className="dash-field">
            <legend className="access-label">Quote expires after</legend>
            <div className="dash-segment">
              {EXPIRY_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`dash-segment-btn${expiry === m ? ' is-active' : ''}`}
                  onClick={() => setExpiry(m)}
                  aria-pressed={expiry === m}
                >
                  {m < 60 ? `${m} min` : `${m / 60} h`}
                </button>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p className="dash-alert" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--ink dash-submit" disabled={!canSubmit}>
            {busy ? 'Creating...' : 'Create checkout'}
            <IconArrowRight size={15} />
          </button>
        </form>

        <aside className="dash-panel dash-quote">
          <p className="eyebrow">Live quote</p>
          <p className="dash-quote-zec num">{zec !== null ? formatZec(zec) : '0.00000000'}</p>
          <p className="dash-quote-unit">ZEC the customer sends</p>
          <div className="dash-kvs">
            <KV k="Payout">
              <span className="num">
                {usd !== null ? formatUsd(usd) : '0.00'} {token.symbol}
              </span>
            </KV>
            <KV k="Rate">
              <span className="num">{price.usd ? `1 ZEC = ${formatUsd(price.usd)} USD` : '...'}</span>
            </KV>
            <KV k="Price feed">
              <span className={`checkout-feed num is-${price.status}`}>{priceLabel(price)}</span>
            </KV>
            <KV k="Settles to">
              <AddressLink address={settlementAddress} label={shortAddr(settlementAddress, 8, 6)} />
            </KV>
          </div>
          <p className="dash-note">
            {token.symbol} is treated as 1.00 USD ({token.name}, issued by {token.issuer}). The ZEC amount is fixed when you
            create the checkout.
          </p>
          <div className={`dash-api-note${apiConfigured() ? ' is-on' : ''}`}>
            <IconLock size={13} />
            {apiConfigured()
              ? 'The ZRail API will issue a single-use shielded address for this checkout.'
              : 'No checkout API configured: this checkout gets a quote and on-chain settlement tracking, but no shielded ZEC address until VITE_ZRAIL_API_URL is set.'}
          </div>
          {!priceOk ? <p className="dash-field-error">Waiting for a live ZEC price before a quote can be locked.</p> : null}
        </aside>
      </div>
    </>
  );
}
