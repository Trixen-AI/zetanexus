import { ENV } from '../config';

/**
 * Client for the ZetaNexus checkout API described on the website
 * (POST /api/checkouts). That service is the liquidity-provider side: it issues
 * the shielded ZEC address. It is not part of this repo, so every call here is
 * gated on VITE_ZETANEXUS_API_URL and nothing is simulated when it is missing.
 */

export const apiConfigured = () => ENV.apiUrl.length > 0;

export type CreateCheckoutRequest = {
  merchant_name: string;
  order_ref: string;
  payout_amount: string;
  payout_asset: string;
  settlement_address: string;
  webhook_url?: string;
};

export type CreateCheckoutResponse = {
  id: string;
  status: string;
  zec_amount: string;
  shielded_address: string;
  expires_at: string;
};

export class ApiError extends Error {}

export async function createRemoteCheckout(body: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  if (!apiConfigured()) throw new ApiError('VITE_ZETANEXUS_API_URL is not set');
  const res = await fetch(`${ENV.apiUrl}/api/checkouts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(`API responded ${res.status} ${res.statusText}`);
  const data = (await res.json()) as Partial<CreateCheckoutResponse>;
  if (!data.id || !data.shielded_address) throw new ApiError('API response is missing id or shielded_address');
  return data as CreateCheckoutResponse;
}

/** Reachability check for the Developers page. */
export async function pingApi(): Promise<{ ok: boolean; detail: string }> {
  if (!apiConfigured()) return { ok: false, detail: 'Not configured' };
  try {
    const started = performance.now();
    const res = await fetch(ENV.apiUrl, { method: 'GET' });
    const ms = Math.round(performance.now() - started);
    return { ok: res.ok, detail: `${res.status} ${res.statusText} in ${ms}ms` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : 'Unreachable' };
  }
}
