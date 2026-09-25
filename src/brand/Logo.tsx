import { WORDMARK_CAP, WORDMARK_DESCENDER, WORDMARK_GLYPHS, WORDMARK_WIDTH } from './logo-paths';

/**
 * The ZKRail lockup, inline.
 *
 * Mark: a "ZK" monogram laid as a rail junction on a square-cut tile. The Z and
 * the K's stem are the rail, in white; the K's arms are the fork where one payment
 * splits: mint for the shielded ZEC leg, orange for the leg that settles in public.
 * The tile is always dark, so the mark reads the same on any background.
 * Geometry matches scripts/build-logo.mjs. Size is set in CSS (height).
 */

const TILE = 'M8 0H40L48 8V40L40 48H8L0 40V8Z';
const EDGE = 'M8.3 0.75H39.7L47.25 8.3V39.7L39.7 47.25H8.3L0.75 39.7V8.3Z';

function MarkShapes() {
  return (
    <>
      <path d={TILE} fill="var(--panel)" />
      <path d={EDGE} fill="none" stroke="var(--graphite)" strokeWidth="1.5" />
      <g fill="none" strokeWidth="4.4" strokeLinejoin="miter">
        <path d="M27 25L40 14" stroke="var(--verdigris)" />
        <path d="M30 22.46L40 34" stroke="var(--sodium)" />
        <path d="M8 14H19L8 34H19" stroke="var(--bone)" strokeLinecap="square" />
        <path d="M27 14V34" stroke="var(--bone)" strokeLinecap="square" />
      </g>
    </>
  );
}

const markSize = WORDMARK_CAP * 1.32;
const markScale = markSize / 48;
const gap = WORDMARK_CAP * 0.34;
const wordX = markSize + gap;
const totalW = wordX + WORDMARK_WIDTH;
const boxH = Math.max(markSize, WORDMARK_CAP + WORDMARK_DESCENDER);

function Glyphs() {
  return (
    <>
      {WORDMARK_GLYPHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </>
  );
}

export function Logo({ className }: { className?: string }) {
  const markY = (boxH - markSize) / 2;
  const baseline = markY + markSize / 2 + WORDMARK_CAP / 2;
  return (
    <svg className={['logo', className].filter(Boolean).join(' ')} viewBox={`0 0 ${totalW.toFixed(2)} ${boxH.toFixed(2)}`} role="img" aria-label="ZKRail">
      <g transform={`translate(0 ${markY.toFixed(2)}) scale(${markScale.toFixed(4)})`}>
        <MarkShapes />
      </g>
      <g transform={`translate(${wordX.toFixed(2)} ${baseline.toFixed(2)})`} fill="var(--logo-ink, var(--ink))">
        <Glyphs />
      </g>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={['logo-mark', className].filter(Boolean).join(' ')} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <MarkShapes />
    </svg>
  );
}

/** Oversized watermark used once, at the foot of the page. */
export function LogoWatermark() {
  const h = WORDMARK_CAP + WORDMARK_DESCENDER;
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_WIDTH.toFixed(2)} ${h.toFixed(2)}`}
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
      focusable="false"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="zk-watermark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-strong)" />
          <stop offset="100%" stopColor="var(--paper)" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${WORDMARK_CAP.toFixed(2)})`} fill="url(#zk-watermark)">
        <Glyphs />
      </g>
    </svg>
  );
}
