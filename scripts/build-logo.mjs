/**
 * Builds the ZRail brand files from one source.
 *
 * Mark : a "Z" laid as a rail inside a square-cut frame (the same notched corner
 *        the UI uses on its ticket panels). The top rail is dashed verdigris: the
 *        shielded ZEC leg, present but unreadable. The diagonal and the bottom
 *        rail are solid bone: the payment settling in public on Robinhood Chain.
 *        A sodium lamp marks the receipt at the end of the public rail.
 * Word : "ZRail" in Bricolage Grotesque 700, outlined to <path>s.
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
const NIGHT = '#0c0d0b';
const BONE = '#ebe8d8';
const SODIUM = '#ff6a2c';
const VERDIGRIS = '#7cc4ad';
const DARK_INK = '#12140f'; // for the light-background variant
const DARK_VERDIGRIS = '#3f8f78';

/* --- 1. the mark, on a 48x48 grid ----------------------------------------- */
const FRAME = 'M9 1.5H39L46.5 9V39L39 46.5H9L1.5 39V9Z';
const mark = ({ ink, rail, lamp }, { solidRail = false, sw = 3.2 } = {}) => `
  <path d="${FRAME}" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linejoin="miter" />
  <path d="M13 14H35" fill="none" stroke="${rail}" stroke-width="${sw + 0.6}" ${solidRail ? '' : 'stroke-dasharray="4.4 3.2"'} />
  <path d="M35 14L14 34H28" fill="none" stroke="${ink}" stroke-width="${sw + 0.6}" stroke-linejoin="miter" stroke-linecap="square" />
  <circle cx="34.5" cy="34" r="3.6" fill="${lamp}" />`;

const onDark = { ink: BONE, rail: VERDIGRIS, lamp: SODIUM };
const onLight = { ink: DARK_INK, rail: DARK_VERDIGRIS, lamp: SODIUM };

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
const word = outline('ZRail');
const capHeight = (bold.tables.os2.sCapHeight / bold.unitsPerEm) * SIZE;
const descender = 6; // no descenders in "ZRail"

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
  <g transform="translate(${(pad + wordX).toFixed(2)} ${baseline.toFixed(2)})" fill="${colors.ink}">${word.glyphs
    .map((d) => `<path d="${d}"/>`)
    .join('')}</g>`;
}
const lockupW = lockW + pad * 2;
const svgDoc = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lockupW.toFixed(2)} ${lockH.toFixed(2)}" width="${lockupW.toFixed(0)}" height="${lockH.toFixed(0)}" role="img" aria-label="ZRail">
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

/* --- 5. favicon + app icons (solid rail: dashes smear at 16px) ------------ */
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
  <rect width="48" height="48" fill="${NIGHT}"/>
  <g transform="translate(4 4) scale(0.8333)">${mark(onDark, { solidRail: true, sw: 3.8 })}</g>
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
    `// "ZRail" outlined from Bricolage Grotesque 700, one path per glyph.\n` +
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
    rails += `<path d="M820 ${y}H990" stroke="${VERDIGRIS}" stroke-opacity="0.7" stroke-width="3" stroke-dasharray="14 10"/>`;
    rails += `<path d="M990 ${y}H1200" stroke="${BONE}" stroke-opacity="0.35" stroke-width="3"/>`;
    rails += `<circle cx="${1040 + ((i * 53) % 140)}" cy="${y}" r="6" fill="${SODIUM}"/>`;
  }
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="lamp" cx="0.82" cy="0.18" r="0.7"><stop offset="0" stop-color="${SODIUM}" stop-opacity="0.26"/><stop offset="1" stop-color="${SODIUM}" stop-opacity="0"/></radialGradient>
    <radialGradient id="shade" cx="0.1" cy="0.95" r="0.7"><stop offset="0" stop-color="${VERDIGRIS}" stop-opacity="0.16"/><stop offset="1" stop-color="${VERDIGRIS}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${NIGHT}"/>
  <rect width="${W}" height="${H}" fill="url(#lamp)"/>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <path d="M990 110V520" stroke="${BONE}" stroke-opacity="0.18" stroke-width="1.5"/>
  ${rails}
  <path d="M18 18H44M18 18V44M${W - 18} 18H${W - 44}M${W - 18} 18V44M18 ${H - 18}H44M18 ${H - 18}V${H - 44}M${W - 18} ${H - 18}H${W - 44}M${W - 18} ${H - 18}V${H - 44}" stroke="${BONE}" stroke-opacity="0.35" stroke-width="1.5" fill="none"/>
  <g transform="translate(${X - pad * lockScale} 64) scale(${lockScale.toFixed(4)})">${lockupBody(onDark)}</g>
  ${text('Spend in the shade.', X, 300, 60, 600, -0.03, BONE)}
  ${text('Settle in the open.', X, 370, 60, 600, -0.03, '#a3a391')}
  ${text('Earn it back in zZEC.', X, 440, 60, 600, -0.03, SODIUM)}
  ${text('Shielded market, merchant checkout and zZEC payouts on Robinhood Chain', X, 520, 22, 400, 0, '#a3a391')}
</svg>`;
  writeFileSync(out('og-image.png'), png(og, W, true));
}

console.log('brand built', { lockupW: lockupW.toFixed(1), lockH: lockH.toFixed(1), capHeight: capHeight.toFixed(1) });
