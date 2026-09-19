/**
 * Builds the ZetaNexus logo and exports every required file.
 *
 * Mark : a "Z" whose diagonal has been replaced by a junction box, the nexus.
 *        The top rail comes in dashed and violet (the shielded ZEC leg, present but
 *        unreadable), enters the node along its top edge, and leaves along the
 *        bottom edge as a solid rail (the public payout on Robinhood Chain). The
 *        green core is the settlement receipt. Z for Zeta, the box for the nexus.
 * Word : "ZetaNexus" in Space Grotesk, the site's brand font, outlined to <path>s.
 *
 * Keep the geometry here in step with src/brand/Logo.tsx.
 *
 * Outputs: public/brand/logo.svg, logo-dark.svg, logo-500.png,
 *          logo-500-transparent.png, logo-mark-500.png (mark only, for social
 *          avatars), favicon.svg, src/brand/logo-paths.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* --- brand constants (kept in step with src/styles/tokens.css) ------------ */
const INK = '#0d0f12';
const PAPER = '#fafaf9';
const SHIELD = '#6e56f8';
const SETTLE = '#12c97e';

/* --- 1. the mark, on a 56x24 grid ----------------------------------------- */
const MARK_W = 56;
const MARK_H = 24;
const mark = ({ ink, shield, settle }) => `
  <path d="M0 3H19" fill="none" stroke="${shield}" stroke-width="4" stroke-dasharray="4.5 3" />
  <rect x="19" y="3" width="18" height="18" rx="4" fill="none" stroke="${ink}" stroke-width="4" />
  <path d="M37 21H56" fill="none" stroke="${ink}" stroke-width="4" />
  <circle cx="28" cy="12" r="4" fill="${settle}" />`;

/* Favicon cut: the same junction zoomed onto a 40 grid, solid stubs so it
   survives 16px, where dashes would smear into grey. */
const favMark = ({ ink, shield, settle }) => `
  <path d="M1 11H11" fill="none" stroke="${shield}" stroke-width="5" />
  <rect x="11" y="11" width="18" height="18" rx="4" fill="none" stroke="${ink}" stroke-width="5" />
  <path d="M29 29H39" fill="none" stroke="${ink}" stroke-width="5" />
  <circle cx="20" cy="20" r="4.2" fill="${settle}" />`;

/* --- 2. the wordmark, outlined from the brand font ------------------------ */
// Static 500 instance: opentype.js mis-reads some gvar deltas in the variable
// TTF (NaN coordinates in e/s), so the outline comes from a fixed-weight WOFF.
const fontBuf = readFileSync(
  resolve(root, 'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff'),
);
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
const SIZE = 100;
const TRACKING = -0.02;

function outline(text) {
  const path = new opentype.Path();
  let x = 0;
  for (const ch of text) {
    const glyph = font.charToGlyph(ch);
    path.extend(glyph.getPath(x, 0, SIZE));
    x += (glyph.advanceWidth / font.unitsPerEm) * SIZE + SIZE * TRACKING;
  }
  return { d: path.toPathData(2), width: x - SIZE * TRACKING };
}

const word = outline('ZetaNexus');
const capHeight = (font.tables.os2.sCapHeight / font.unitsPerEm) * SIZE;

/* --- 3. compose ----------------------------------------------------------- */
// Mark height is 1.05x the cap height (it is a wide mark), vertically centred
// on the caps, with a clear-space gap of half the cap height.
const markScale = (capHeight * 1.05) / MARK_H;
const markW = MARK_W * markScale;
const markH = MARK_H * markScale;
const gap = capHeight * 0.5;
const wordX = markW + gap;
const totalW = wordX + word.width;
const pad = capHeight * 0.2;
const boxH = capHeight + pad * 2;

function lockup(colors, bg) {
  const w = totalW + pad * 2;
  const markY = pad + (capHeight - markH) / 2;
  return {
    w,
    h: boxH,
    body: `${bg ? `<rect width="${w.toFixed(2)}" height="${boxH.toFixed(2)}" fill="${bg}" />` : ''}
  <g transform="translate(${pad.toFixed(2)} ${markY.toFixed(2)}) scale(${markScale.toFixed(4)})">${mark(colors)}
  </g>
  <g transform="translate(${(pad + wordX).toFixed(2)} ${(pad + capHeight).toFixed(2)})" fill="${colors.ink}">
    <path d="${word.d}" />
  </g>`,
  };
}

const svgDoc = ({ w, h, body }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" role="img" aria-label="ZetaNexus">
  ${body}
</svg>\n`;

const light = { ink: INK, shield: SHIELD, settle: SETTLE };
const dark = { ink: PAPER, shield: '#a596ff', settle: '#5ee0ab' };

mkdirSync(resolve(root, 'public/brand'), { recursive: true });
writeFileSync(resolve(root, 'public/brand/logo.svg'), svgDoc(lockup(light)));
writeFileSync(resolve(root, 'public/brand/logo-dark.svg'), svgDoc(lockup(dark, INK)));

/* --- 4. 500x500 exports, logo centred with ~12% padding ------------------- */
function square(bg) {
  const l = lockup(light);
  const scale = (500 * 0.76) / l.w;
  const x = (500 - l.w * scale) / 2;
  const y = (500 - l.h * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
${bg ? `  <rect width="500" height="500" fill="${bg}" />\n` : ''}  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${l.body}</g>
</svg>`;
}

for (const [file, bg] of [['logo-500.png', PAPER], ['logo-500-transparent.png', null]]) {
  const png = new Resvg(square(bg), { fitTo: { mode: 'width', value: 500 } }).render().asPng();
  writeFileSync(resolve(root, 'public/brand', file), png);
}

/* --- 4b. mark only, 500x500 on the brand background ----------------------
   For social avatars (X crops to a circle). The mark is centred at 72% of the
   width; its corners sit about 45px inside the circle, so nothing gets cut. */
{
  const w = 500 * 0.72;
  const scale = w / MARK_W;
  const h = MARK_H * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${PAPER}" />
  <g transform="translate(${((500 - w) / 2).toFixed(2)} ${((500 - h) / 2).toFixed(2)}) scale(${scale.toFixed(4)})">${mark(light)}
  </g>
</svg>`;
  writeFileSync(resolve(root, 'public/brand/logo-mark.svg'), `${svg}\n`);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 500 } }).render().asPng();
  writeFileSync(resolve(root, 'public/brand/logo-mark-500.png'), png);
}

/* --- 5. favicon ----------------------------------------------------------- */
writeFileSync(
  resolve(root, 'public/brand/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="${PAPER}" />
  <g transform="translate(0 0) scale(1.6)">${favMark(light)}
  </g>
</svg>\n`,
);

/* --- 6. React-side outlined wordmark -------------------------------------- */
mkdirSync(resolve(root, 'src/brand'), { recursive: true });
writeFileSync(
  resolve(root, 'src/brand/logo-paths.ts'),
  `// Generated by scripts/build-logo.mjs - do not edit by hand.\n` +
    `// "ZetaNexus" outlined from Space Grotesk so the logo never depends on the web font.\n` +
    `export const WORDMARK_PATH =\n  '${word.d}';\n` +
    `export const WORDMARK_WIDTH = ${word.width.toFixed(2)};\n` +
    `export const WORDMARK_CAP = ${capHeight.toFixed(2)};\n`,
);

console.log('logo built', { totalW: totalW.toFixed(1), capHeight: capHeight.toFixed(1), markW: markW.toFixed(1) });

/* --- 7. social card + app icons ------------------------------------------- */
// og-image.png (1200x630) for link previews, apple-touch-icon + PWA icons.
// Everything is drawn from the same brand source: lockup, rail motif, tokens.
// Static TTFs from the Space Grotesk project (OFL, see scripts/fonts/OFL.txt).
// opentype.js drops outline segments from a few 300-weight glyphs (the "a" and
// "n" came out as wedges), so the card's text is laid out and drawn by resvg's
// own text engine; opentype.js only measures advances for positioning.
const FONT_FILES = [300, 400, 500].map((w) => resolve(root, `scripts/fonts/SpaceGrotesk-${w}.ttf`));

function loadFont(weight) {
  const buf = readFileSync(resolve(root, `scripts/fonts/SpaceGrotesk-${weight}.ttf`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function measure(f, text, size, tracking) {
  let x = 0;
  for (const ch of text) x += (f.charToGlyph(ch).advanceWidth / f.unitsPerEm) * size + size * tracking;
  return x - size * tracking;
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const textEl = (text, x, y, size, weight, tracking, fill) =>
  `<text x="${x}" y="${y}" font-family="Space Grotesk" font-size="${size}" font-weight="${weight}" letter-spacing="${(size * tracking).toFixed(2)}" fill="${fill}">${esc(text)}</text>`;

{
  const light300 = loadFont(300);
  const regular400 = loadFont(400);
  const W = 1200;
  const H = 630;
  const X = 84;

  const lock = lockup(light);
  const lockScale = 360 / lock.w;
  const T = {
    line1: ['Private ZEC in.', 66, 300, -0.03],
    line2: ['Onchain settlement out.', 66, 300, -0.03],
    sub: ['Shielded ZEC checkout, settled on Robinhood Chain', 25, 400, -0.005],
    domain: ['z2r-nexus.com', 25, 400, 0.01],
  };
  const width = ([text, size, weight, tr]) => measure(weight === 300 ? light300 : regular400, text, size, tr);

  // Rails start right of the longest text line, dashed (shielded) then solid (settled).
  const textRight = X + Math.max(width(T.line1), width(T.line2), width(T.sub));
  const railStart = Math.max(textRight + 56, 760);
  const cross = railStart + (W - railStart) * 0.42;
  let rails = '';
  for (let i = 0; i < 7; i += 1) {
    const t = (i - 3) / 3;
    const y0 = 315 + t * 120;
    const y1 = 315 + t * 250;
    const yc = y0 + (y1 - y0) * 0.42;
    rails += `<path d="M${railStart} ${y0.toFixed(1)}L${cross.toFixed(1)} ${yc.toFixed(1)}" stroke="${SHIELD}" stroke-opacity="0.55" stroke-width="2.2" stroke-dasharray="12 10" fill="none"/>`;
    rails += `<path d="M${cross.toFixed(1)} ${yc.toFixed(1)}L${W} ${y1.toFixed(1)}" stroke="${SETTLE}" stroke-opacity="0.7" stroke-width="2.2" fill="none"/>`;
    const nx = cross + (W - cross) * (0.3 + ((i * 37) % 50) / 100);
    const ny = yc + (y1 - yc) * ((nx - cross) / (W - cross));
    rails += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" fill="${SETTLE}"/>`;
  }

  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="v" cx="0.12" cy="0.1" r="0.75"><stop offset="0" stop-color="${SHIELD}" stop-opacity="0.22"/><stop offset="1" stop-color="${SHIELD}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g" cx="0.92" cy="0.9" r="0.7"><stop offset="0" stop-color="${SETTLE}" stop-opacity="0.26"/><stop offset="1" stop-color="${SETTLE}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <path d="M${cross.toFixed(1)} 150V480" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.5"/>
  ${rails}
  <g transform="translate(${X - pad * lockScale} 70) scale(${lockScale.toFixed(4)})">${lock.body}</g>
  ${textEl(T.line1[0], X, 318, T.line1[1], T.line1[2], T.line1[3], INK)}
  ${textEl(T.line2[0], X, 398, T.line2[1], T.line2[2], T.line2[3], '#5b616a')}
  ${textEl(T.sub[0], X, 468, T.sub[1], T.sub[2], T.sub[3], '#6b727c')}
  ${textEl(T.domain[0], X, 560, T.domain[1], T.domain[2], T.domain[3], SHIELD)}
</svg>`;
  const ogPng = new Resvg(og, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Space Grotesk' },
  })
    .render()
    .asPng();
  writeFileSync(resolve(root, 'public/brand/og-image.png'), ogPng);

  // Square icons: full-bleed paper (platforms apply their own rounding), zoomed junction mark.
  const icon = (size) =>
    new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
  <rect width="40" height="40" fill="${PAPER}"/>
  <g transform="translate(4 4) scale(0.8)">${favMark(light)}</g>
</svg>`,
      { fitTo: { mode: 'width', value: size } },
    )
      .render()
      .asPng();
  writeFileSync(resolve(root, 'public/brand/apple-touch-icon.png'), icon(180));
  writeFileSync(resolve(root, 'public/brand/icon-192.png'), icon(192));
  writeFileSync(resolve(root, 'public/brand/icon-512.png'), icon(512));
  writeFileSync(resolve(root, 'public/brand/favicon-32.png'), icon(32));
  console.log('social + icons built', { railStart: Math.round(railStart), textRight: Math.round(textRight) });
}
