import { WORDMARK_CAP, WORDMARK_PATH, WORDMARK_WIDTH } from './logo-paths';

/**
 * The ZetaNexus lockup, inline.
 *
 * Mark: a "Z" whose diagonal is replaced by a junction box, the nexus. The dashed
 * violet rail is the shielded ZEC leg coming in; the solid rail leaving the
 * bottom edge is the public payout on Robinhood Chain; the green core is the
 * settlement receipt. Geometry matches scripts/build-logo.mjs.
 *
 * Size is set in CSS (height), so the logo scales per breakpoint instead of
 * being pinned to one pixel size.
 */

const MARK_W = 56;
const MARK_H = 24;

function MarkShapes() {
  return (
    <>
      <path d="M0 3H19" fill="none" stroke="var(--logo-shield, var(--shield))" strokeWidth="4" strokeDasharray="4.5 3" />
      <rect x="19" y="3" width="18" height="18" rx="4" fill="none" stroke="var(--logo-ink, currentColor)" strokeWidth="4" />
      <path d="M37 21H56" fill="none" stroke="var(--logo-ink, currentColor)" strokeWidth="4" />
      <circle cx="28" cy="12" r="4" fill="var(--logo-settle, var(--settle))" />
    </>
  );
}

// Lockup geometry in wordmark units (cap height = WORDMARK_CAP).
const markScale = (WORDMARK_CAP * 1.05) / MARK_H;
const markW = MARK_W * markScale;
const markH = MARK_H * markScale;
const gap = WORDMARK_CAP * 0.5;
const wordX = markW + gap;
const totalW = wordX + WORDMARK_WIDTH;
const padY = WORDMARK_CAP * 0.06;
const boxH = Math.max(markH, WORDMARK_CAP) + padY * 2;

export function Logo({ className }: { className?: string }) {
  const markY = (boxH - markH) / 2;
  const baseline = (boxH + WORDMARK_CAP) / 2;
  return (
    <svg
      className={['logo', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${totalW.toFixed(2)} ${boxH.toFixed(2)}`}
      role="img"
      aria-label="ZetaNexus"
    >
      <g transform={`translate(0 ${markY.toFixed(2)}) scale(${markScale.toFixed(4)})`}>
        <MarkShapes />
      </g>
      <g transform={`translate(${wordX.toFixed(2)} ${baseline.toFixed(2)})`} fill="var(--logo-ink, currentColor)">
        <path d={WORDMARK_PATH} />
      </g>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={['logo-mark', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${MARK_W} ${MARK_H}`}
      aria-hidden="true"
      focusable="false"
    >
      <MarkShapes />
    </svg>
  );
}

/** Oversized watermark used once, at the foot of the page. */
export function LogoWatermark() {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_WIDTH.toFixed(2)} ${WORDMARK_CAP.toFixed(2)}`}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
      focusable="false"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="zn-watermark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-strong)" />
          <stop offset="100%" stopColor="var(--paper)" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${WORDMARK_CAP.toFixed(2)})`} fill="url(#zn-watermark)">
        <path d={WORDMARK_PATH} />
      </g>
    </svg>
  );
}
