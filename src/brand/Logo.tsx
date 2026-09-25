import { WORDMARK_CAP, WORDMARK_DESCENDER, WORDMARK_GLYPHS, WORDMARK_WIDTH } from './logo-paths';

/**
 * The ZRail lockup, inline.
 *
 * Mark: a "Z" laid as a rail inside a square-cut frame. The dashed verdigris top
 * rail is the shielded ZEC leg; the solid bone diagonal and bottom rail are the
 * payment settling in public; the sodium lamp marks the receipt.
 * Geometry matches scripts/build-logo.mjs. Size is set in CSS (height).
 */

const FRAME = 'M9 1.5H39L46.5 9V39L39 46.5H9L1.5 39V9Z';

function MarkShapes() {
  return (
    <>
      <path d={FRAME} fill="none" stroke="var(--logo-ink, var(--ink))" strokeWidth="2.6" strokeLinejoin="miter" />
      <path d="M13 14H35" fill="none" stroke="var(--logo-rail, var(--verdigris))" strokeWidth="3.8" strokeDasharray="4.4 3.2" />
      <path d="M35 14L14 34H28" fill="none" stroke="var(--logo-ink, var(--ink))" strokeWidth="3.8" strokeLinejoin="miter" strokeLinecap="square" />
      <circle cx="34.5" cy="34" r="3.6" fill="var(--logo-lamp, var(--sodium))" />
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
    <svg className={['logo', className].filter(Boolean).join(' ')} viewBox={`0 0 ${totalW.toFixed(2)} ${boxH.toFixed(2)}`} role="img" aria-label="ZRail">
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
        <linearGradient id="zr-watermark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--line-strong)" />
          <stop offset="100%" stopColor="var(--paper)" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${WORDMARK_CAP.toFixed(2)})`} fill="url(#zr-watermark)">
        <Glyphs />
      </g>
    </svg>
  );
}
