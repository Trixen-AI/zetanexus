import { formatUnits, parseUnits } from 'viem';

export const shortAddr = (a?: string | null, head = 6, tail = 4) =>
  a ? (a.length > head + tail + 3 ? `${a.slice(0, head)}...${a.slice(-tail)}` : a) : '';

export const shortHash = (h?: string | null) => shortAddr(h, 8, 6);

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyPrecise = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

/** Token amount (base units) to a display string. */
export function fmtToken(value: bigint, decimals: number, precise = false) {
  const n = Number(formatUnits(value, decimals));
  return (precise ? moneyPrecise : money).format(n);
}

/** Decimal string to base units; null when the string is not a valid amount. */
export function toUnits(amount: string, decimals: number): bigint | null {
  const clean = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const [, frac = ''] = clean.split('.');
  if (frac.length > decimals) return null;
  try {
    return parseUnits(clean, decimals);
  } catch {
    return null;
  }
}

export const fmtEth = (wei: bigint) => {
  const n = Number(formatUnits(wei, 18));
  return n === 0 ? '0' : n < 0.0001 ? '<0.0001' : n.toFixed(4);
};

const dateTime = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const fmtDateTime = (ms: number) => dateTime.format(new Date(ms));

export function fmtRelative(ms: number, now = Date.now()) {
  const s = Math.round((now - ms) / 1000);
  const abs = Math.abs(s);
  const unit =
    abs < 60 ? [s, 's'] : abs < 3600 ? [Math.round(s / 60), 'm'] : abs < 86400 ? [Math.round(s / 3600), 'h'] : [Math.round(s / 86400), 'd'];
  const [v, u] = unit as [number, string];
  return v >= 0 ? `${v}${u} ago` : `in ${-v}${u}`;
}

export function fmtCountdown(msLeft: number) {
  if (msLeft <= 0) return '00:00';
  const total = Math.floor(msLeft / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
