/**
 * Builds the ZKRail brand files from one source.
 *
 * Mark : a "ZK" monogram laid as a rail junction on a square-cut tile (the same
 *        notched corner the UI uses on its ticket panels). The Z and the K's stem
 *        are the rail itself, in white. The K's two arms are the fork where one
 *        payment splits: the upper arm is mint, the shielded ZEC leg; the lower
 *        arm branches off it in orange, the leg that settles in public.
 * Word : "ZKRail" in Bricolage Grotesque 700, outlined to <path>s.
 * Colour: the zats.market palette in src/styles/tokens.css.
 *
 * Keep the geometry here in step with src/brand/Logo.tsx.
 *
 * Outputs (public/brand): logo.svg, logo-light.svg, logo-500.png,
 *   logo-500-transparent.png, logo-mark.svg, logo-mark-500.png, favicon.svg,
 *   favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png
 * and src/brand/logo-paths.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (f) => resolve(root, 'public/brand', f);
mkdirSync(resolve(root, 'public/brand'), { recursive: true });

/* --- palette (kept in step with src/styles/tokens.css) -------------------- */
const NIGHT = '#0a0a0b'; // black
const PANEL = '#171718';
const GRAPHITE = '#323232';
const WHITE = '#ffffff';
const GREY = '#999999';
const ORANGE = '#f98500';
const MINT = '#71cfa3';

/* --- 1. the mark, on a 48x48 grid ----------------------------------------- */
const TILE = 'M8 0H40L48 8V40L40 48H8L0 40V8Z';
const EDGE = 'M8.3 0.75H39.7L47.25 8.3V39.7L39.7 47.25H8.3L0.75 39.7V8.3Z';
const mark = ({ tile, edge, ink, shield, pub }, { sw = 4.4 } = {}) => `
  <path d="${TILE}" fill="${tile}" />
  <path d="${EDGE}" fill="none" stroke="${edge}" stroke-width="1.5" />
  <g fill="none" stroke-width="${sw}" stroke-linejoin="miter">
    <path d="M27 25L40 14" stroke="${shield}" />
    <path d="M30 22.46L40 34" stroke="${pub}" />
    <path d="M8 14H19L8 34H19" stroke="${ink}" stroke-linecap="square" />
    <path d="M27 14V34" stroke="${ink}" stroke-linecap="square" />
  </g>`;

// The tile is always dark, so the mark reads the same on light and dark pages;
// only the wordmark flips for the light variant.
const onDark = { tile: PANEL, edge: GRAPHITE, ink: WHITE, shield: MINT, pub: ORANGE, word: WHITE };
const onLight = { ...onDark, word: NIGHT };

/* --- 2. the wordmark ------------------------------------------------------ */
const FONT_FILES = [400, 600, 700].map((w) => resolve(root, `scripts/fonts/Bricolage-${w}.ttf`));
function loadFont(w) {
  const b = readFileSync(resolve(root, `scripts/fonts/Bricolage-${w}.ttf`));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const bold = loadFont(700);
const SIZE = 100;
const TRACK = -0.03;

// One path per glyph: joined glyph paths have been mis-read by resvg before.
function outline(text) {
  const glyphs = [];
  let x = 0;
  for (const ch of text) {
    const g = bold.charToGlyph(ch);
    const d = g.getPath(x, 0, SIZE).toPathData(2);
    if (d) glyphs.push(d);
    x += (g.advanceWidth / bold.unitsPerEm) * SIZE + SIZE * TRACK;
  }
  return { glyphs, width: x - SIZE * TRACK };
}
const word = outline('ZKRail');
const capHeight = (bold.tables.os2.sCapHeight / bold.unitsPerEm) * SIZE;
const descender = 6; // no descenders in "ZKRail"

/* --- 3. lockup ------------------------------------------------------------ */
const markSize = capHeight * 1.32;
const markScale = markSize / 48;
const gap = capHeight * 0.34;
const wordX = markSize + gap;
const lockW = wordX + word.width;
const pad = capHeight * 0.18;
const lockH = Math.max(markSize, capHeight + descender) + pad * 2;

function lockupBody(colors) {
  const markY = (lockH - markSize) / 2;
  const baseline = markY + markSize / 2 + capHeight / 2;
  return `<g transform="translate(${pad.toFixed(2)} ${markY.toFixed(2)}) scale(${markScale.toFixed(4)})">${mark(colors)}</g>
  <g transform="translate(${(pad + wordX).toFixed(2)} ${baseline.toFixed(2)})" fill="${colors.word}">${word.glyphs
    .map((d) => `<path d="${d}"/>`)
    .join('')}</g>`;
}
const lockupW = lockW + pad * 2;
const svgDoc = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lockupW.toFixed(2)} ${lockH.toFixed(2)}" width="${lockupW.toFixed(0)}" height="${lockH.toFixed(0)}" role="img" aria-label="ZKRail">
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}
</svg>\n`;

writeFileSync(out('logo.svg'), svgDoc(lockupBody(onDark), NIGHT));
writeFileSync(out('logo-light.svg'), svgDoc(lockupBody(onLight)));

/* --- 4. 500x500 exports --------------------------------------------------- */
const png = (svg, width, fonts = false) =>
  new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    ...(fonts ? { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' } } : {}),
  })
    .render()
    .asPng();

function square(colors, bg) {
  const scale = (500 * 0.76) / lockupW;
  const x = (500 - lockupW * scale) / 2;
  const y = (500 - lockH * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
${bg ? `<rect width="500" height="500" fill="${bg}"/>` : ''}<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${lockupBody(colors)}</g></svg>`;
}
writeFileSync(out('logo-500.png'), png(square(onDark, NIGHT), 500));
writeFileSync(out('logo-500-transparent.png'), png(square(onDark, null), 500));

// mark only, for avatars (X crops to a circle): 60% width keeps the corners inside it
{
  const w = 500 * 0.6;
  const s = w / 48;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${NIGHT}"/>
  <g transform="translate(${((500 - w) / 2).toFixed(2)} ${((500 - w) / 2).toFixed(2)}) scale(${s.toFixed(4)})">${mark(onDark)}</g>
</svg>`;
  writeFileSync(out('logo-mark.svg'), `${svg}\n`);
  writeFileSync(out('logo-mark-500.png'), png(svg, 500));
}

/* --- 5. favicon + app icons: the tile fills the icon, strokes a touch heavier for 16px */
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">${mark(onDark, { sw: 5 })}
</svg>`;
writeFileSync(out('favicon.svg'), `${iconSvg(64)}\n`);
writeFileSync(out('favicon-32.png'), png(iconSvg(32), 32));
writeFileSync(out('apple-touch-icon.png'), png(iconSvg(180), 180));
writeFileSync(out('icon-192.png'), png(iconSvg(192), 192));
writeFileSync(out('icon-512.png'), png(iconSvg(512), 512));

/* --- 6. React-side outlined wordmark -------------------------------------- */
writeFileSync(
  resolve(root, 'src/brand/logo-paths.ts'),
  `// Generated by scripts/build-logo.mjs - do not edit by hand.\n` +
    `// "ZKRail" outlined from Bricolage Grotesque 700, one path per glyph.\n` +
    `export const WORDMARK_GLYPHS: string[] = ${JSON.stringify(word.glyphs)};\n` +
    `export const WORDMARK_WIDTH = ${word.width.toFixed(2)};\n` +
    `export const WORDMARK_CAP = ${capHeight.toFixed(2)};\n` +
    `export const WORDMARK_DESCENDER = ${descender};\n`,
);

/* --- 7. social card (1200x630) -------------------------------------------- */
{
  const W = 1200;
  const H = 630;
  const X = 84;
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const text = (t, x, y, size, weight, track, fill) =>
    `<text x="${x}" y="${y}" font-family="Bricolage Grotesque" font-size="${size}" font-weight="${weight}" letter-spacing="${(size * track).toFixed(2)}" fill="${fill}">${esc(t)}</text>`;

  const lockScale = 330 / lockupW;
  let rails = '';
  for (let i = 0; i < 6; i += 1) {
    const y = 150 + i * 70;
    rails += `<path d="M820 ${y}H990" stroke="${MINT}" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="14 10"/>`;
    rails += `<path d="M990 ${y}H1200" stroke="${WHITE}" stroke-opacity="0.3" stroke-width="3"/>`;
    rails += `<circle cx="${1040 + ((i * 53) % 140)}" cy="${y}" r="6" fill="${ORANGE}"/>`;
  }
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="lamp" cx="0.82" cy="0.18" r="0.7"><stop offset="0" stop-color="${ORANGE}" stop-opacity="0.24"/><stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/></radialGradient>
    <radialGradient id="shade" cx="0.1" cy="0.95" r="0.7"><stop offset="0" stop-color="${MINT}" stop-opacity="0.14"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${NIGHT}"/>
  <rect width="${W}" height="${H}" fill="url(#lamp)"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <path d="M990 110V520" stroke="${WHITE}" stroke-opacity="0.16" stroke-width="1.5"/>
  ${rails}
  <path d="M18 18H44M18 18V44M${W - 18} 18H${W - 44}M${W - 18} 18V44M18 ${H - 18}H44M18 ${H - 18}V${H - 44}M${W - 18} ${H - 18}H${W - 44}M${W - 18} ${H - 18}V${H - 44}" stroke="${WHITE}" stroke-opacity="0.3" stroke-width="1.5" fill="none"/>
  <g transform="translate(${X - pad * lockScale} 64) scale(${lockScale.toFixed(4)})">${lockupBody(onDark)}</g>
  ${text('Spend in the shade.', X, 300, 60, 600, -0.03, WHITE)}
  ${text('Settle in the open.', X, 370, 60, 600, -0.03, GREY)}
  ${text('Earn it back in zZEC.', X, 440, 60, 600, -0.03, ORANGE)}
  ${text('Shielded market, merchant checkout and zZEC payouts on Robinhood Chain', X, 520, 22, 400, 0, GREY)}
</svg>`;
  writeFileSync(out('og-image.png'), png(og, W, true));
}

console.log('brand built', { lockupW: lockupW.toFixed(1), lockH: lockH.toFixed(1), capHeight: capHeight.toFixed(1) });
