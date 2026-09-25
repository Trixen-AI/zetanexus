/**
 * Builds the ZKRail brand files from one source.
 *
 * Mark : a rail leaving a tunnel. The black portal is the shade, where the ZEC
 *        payment travels shielded; one yellow lamp inside shows something is
 *        moving there without showing what. The track runs out of the portal into
 *        the yellow daylight of the tile: the leg that settles in the open.
 * Word : "ZKRail" in Bricolage Grotesque 700, outlined to <path>s.
 * Colour: the zama.org palette in src/styles/tokens.css (yellow, black, warm grey).
 *
 * Keep the geometry here in step with src/brand/Logo.tsx.
 *
 * Outputs (public/brand): logo.svg (on white), logo-light.svg (transparent, black
 *   word), logo-dark.svg (transparent, white word), logo-500.png,
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
const YELLOW = '#ffd209'; // Zama yellow
const ORANGE = '#ffb243'; // Zama orange
const BLACK = '#000000';
const WHITE = '#ffffff';
const WARM = '#f2efec'; // warm grey
const MUTE = '#676462'; // black at 64% on white

/* --- 1. the mark, on a 48x48 grid ----------------------------------------- */
const TILE = 'M8 0H40A8 8 0 0 1 48 8V40A8 8 0 0 1 40 48H8A8 8 0 0 1 0 40V8A8 8 0 0 1 8 0Z';
const PORTAL = 'M9 35V22A15 15 0 0 1 39 22V35Z';
const mark = ({ sw = 3 } = {}) => `
  <path d="${TILE}" fill="${YELLOW}" />
  <path d="${PORTAL}" fill="${BLACK}" />
  <circle cx="24" cy="24" r="3.2" fill="${YELLOW}" />
  <g fill="none" stroke="${BLACK}" stroke-linecap="butt">
    <path d="M19.5 35L12 46.6M28.5 35L36 46.6" stroke-width="${sw}" />
    <path d="M16 40H32M13 44.8H35" stroke-width="${(sw * 0.8).toFixed(2)}" />
  </g>`;

/* --- 2. the wordmark ------------------------------------------------------ */
const FONT_FILES = [400, 600, 700].map((w) => resolve(root, `scripts/fonts/Bricolage-${w}.ttf`));
function loadFont(w) {
  const b = readFileSync(resolve(root, `scripts/fonts/Bricolage-${w}.ttf`));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const bold = loadFont(700);
const semi = loadFont(600);
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

function lockupBody(wordColor) {
  const markY = (lockH - markSize) / 2;
  const baseline = markY + markSize / 2 + capHeight / 2;
  return `<g transform="translate(${pad.toFixed(2)} ${markY.toFixed(2)}) scale(${markScale.toFixed(4)})">${mark()}</g>
  <g transform="translate(${(pad + wordX).toFixed(2)} ${baseline.toFixed(2)})" fill="${wordColor}">${word.glyphs
    .map((d) => `<path d="${d}"/>`)
    .join('')}</g>`;
}
const lockupW = lockW + pad * 2;
const svgDoc = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lockupW.toFixed(2)} ${lockH.toFixed(2)}" width="${lockupW.toFixed(0)}" height="${lockH.toFixed(0)}" role="img" aria-label="ZKRail">
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}
</svg>\n`;

writeFileSync(out('logo.svg'), svgDoc(lockupBody(BLACK), WHITE));
writeFileSync(out('logo-light.svg'), svgDoc(lockupBody(BLACK)));
writeFileSync(out('logo-dark.svg'), svgDoc(lockupBody(WHITE)));

/* --- 4. 500x500 exports --------------------------------------------------- */
const png = (svg, width, fonts = false) =>
  new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    ...(fonts ? { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' } } : {}),
  })
    .render()
    .asPng();

function square(wordColor, bg) {
  const scale = (500 * 0.76) / lockupW;
  const x = (500 - lockupW * scale) / 2;
  const y = (500 - lockH * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
${bg ? `<rect width="500" height="500" fill="${bg}"/>` : ''}<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${lockupBody(wordColor)}</g></svg>`;
}
writeFileSync(out('logo-500.png'), png(square(BLACK, WHITE), 500));
writeFileSync(out('logo-500-transparent.png'), png(square(BLACK, null), 500));

// mark only, for avatars (X crops to a circle): 64% width keeps the tile inside it
{
  const w = 500 * 0.64;
  const s = w / 48;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${WHITE}"/>
  <g transform="translate(${((500 - w) / 2).toFixed(2)} ${((500 - w) / 2).toFixed(2)}) scale(${s.toFixed(4)})">${mark()}</g>
</svg>`;
  writeFileSync(out('logo-mark.svg'), `${svg}\n`);
  writeFileSync(out('logo-mark-500.png'), png(svg, 500));
}

/* --- 5. favicon + app icons: the tile is the icon, rails a touch heavier for 16px */
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">${mark({ sw: 3.6 })}
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

/* --- 7. social card (1200x630), light like zama.org ----------------------- */
{
  const W = 1200;
  const H = 630;
  const X = 84;
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const text = (t, x, y, size, weight, track, fill) =>
    `<text x="${x}" y="${y}" font-family="Bricolage Grotesque" font-size="${size}" font-weight="${weight}" letter-spacing="${(size * track).toFixed(2)}" fill="${fill}">${esc(t)}</text>`;

  // yellow marker behind the last headline line, measured from the same font
  const earn = 'Earn it back in zZEC.';
  const earnW = [...earn].reduce((w, ch) => w + (semi.charToGlyph(ch).advanceWidth / semi.unitsPerEm) * 60 + 60 * -0.03, 0);

  const lockScale = 330 / lockupW;
  let rails = '';
  for (let i = 0; i < 6; i += 1) {
    const y = 150 + i * 70;
    rails += `<path d="M820 ${y}H990" stroke="${BLACK}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="14 10"/>`;
    rails += `<path d="M990 ${y}H1200" stroke="${BLACK}" stroke-opacity="0.18" stroke-width="3"/>`;
    rails += `<circle cx="${1040 + ((i * 53) % 140)}" cy="${y}" r="7" fill="${YELLOW}" stroke="${BLACK}" stroke-opacity="0.6" stroke-width="2"/>`;
  }
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="sun" cx="0.1" cy="0.08" r="0.75"><stop offset="0" stop-color="${YELLOW}" stop-opacity="0.55"/><stop offset="1" stop-color="${YELLOW}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow" cx="0.88" cy="0.9" r="0.6"><stop offset="0" stop-color="${ORANGE}" stop-opacity="0.4"/><stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${WARM}"/>
  <rect width="${W}" height="${H}" fill="url(#sun)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <path d="M990 110V520" stroke="${BLACK}" stroke-opacity="0.14" stroke-width="1.5"/>
  ${rails}
  <path d="M18 18H44M18 18V44M${W - 18} 18H${W - 44}M${W - 18} 18V44M18 ${H - 18}H44M18 ${H - 18}V${H - 44}M${W - 18} ${H - 18}H${W - 44}M${W - 18} ${H - 18}V${H - 44}" stroke="${BLACK}" stroke-opacity="0.3" stroke-width="1.5" fill="none"/>
  <g transform="translate(${X - pad * lockScale} 64) scale(${lockScale.toFixed(4)})">${lockupBody(BLACK)}</g>
  ${text('Spend in the shade.', X, 300, 60, 600, -0.03, BLACK)}
  ${text('Settle in the open.', X, 370, 60, 600, -0.03, MUTE)}
  <rect x="${X - 8}" y="${440 - 50}" width="${(earnW + 16).toFixed(1)}" height="64" fill="${YELLOW}"/>
  ${text(earn, X, 440, 60, 600, -0.03, BLACK)}
  ${text('Shielded market, merchant checkout and zZEC payouts on Robinhood Chain', X, 520, 22, 400, 0, MUTE)}
</svg>`;
  writeFileSync(out('og-image.png'), png(og, W, true));
}

console.log('brand built', { lockupW: lockupW.toFixed(1), lockH: lockH.toFixed(1), capHeight: capHeight.toFixed(1) });
