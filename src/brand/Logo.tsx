import { WORDMARK_CAP, WORDMARK_DESCENDER, WORDMARK_GLYPHS, WORDMARK_WIDTH } from './logo-paths';

/**
 * The ZKRail lockup, inline.
 *
 * Mark: a rail leaving a tunnel. The black portal is the shade, where the ZEC
 * payment travels shielded, with one yellow lamp showing something moves there;
 * the track runs out into the yellow daylight of the tile, the leg that settles
 * in the open. Zama yellow and black, fixed, so it reads on any background.
 * Geometry matches scripts/build-logo.mjs. Size is set in CSS (height).
 */

const TILE = 'M8 0H40A8 8 0 0 1 48 8V40A8 8 0 0 1 40 48H8A8 8 0 0 1 0 40V8A8 8 0 0 1 8 0Z';
const PORTAL = 'M9 35V22A15 15 0 0 1 39 22V35Z';

function MarkShapes() {
  return (
    <>
      <path d={TILE} fill="var(--sodium)" />
      <path d={PORTAL} fill="var(--bone)" />
      <circle cx="24" cy="24" r="3.2" fill="var(--sodium)" />
      <g fill="none" stroke="var(--bone)">
        <path d="M19.5 35L12 46.6M28.5 35L36 46.6" strokeWidth="3" />
        <path d="M16 40H32M13 44.8H35" strokeWidth="2.4" />
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
