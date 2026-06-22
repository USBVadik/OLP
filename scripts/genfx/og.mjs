// Deterministic OpenGraph card (no AI gen) — landscape brand card in the OneLink Pay palette.
// Rasterized via sharp from an inline SVG so the link preview looks intentional when the
// deployed URL is shared (submission form, judges, Discord).
// Output:
//   public/og.png   1200x630   brand card: mark + wordmark + "card, not your wallet" tagline
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// Scalable mark (same geometry as logo.mjs): iris ring + gold ring + ink tile + cream "O" donut.
function mark(cx, cy, s = 1) {
  const r1 = 262 * s;
  const r2 = 232 * s;
  const tile = 256 * s;
  const o1 = 80 * s;
  const o2 = 45 * s;
  return `
  <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="#6E56F0" stroke-width="${4 * s}" opacity="0.22"/>
  <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="#A87B36" stroke-width="${14 * s}" stroke-linecap="round"/>
  <rect x="${cx - tile / 2}" y="${cy - tile / 2}" width="${tile}" height="${tile}" rx="${60 * s}" fill="#23201B"/>
  <circle cx="${cx}" cy="${cy}" r="${o1}" fill="#FBF8F3"/>
  <circle cx="${cx}" cy="${cy}" r="${o2}" fill="#23201B"/>`;
}

const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="28%" cy="44%" r="86%">
      <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F3E9D6"/>
    </radialGradient>
    <radialGradient id="iris" cx="26%" cy="52%" r="34%">
      <stop offset="0%" stop-color="#6E56F0" stop-opacity="0.10"/><stop offset="100%" stop-color="#6E56F0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#iris)"/>
  ${mark(312, 330, 0.56)}
  <text x="505" y="232" font-family="${FONT}" font-size="22" font-weight="600" letter-spacing="2.5" fill="#A87B36">PERMISSION FIREWALL FOR AI AGENTS</text>
  <text x="503" y="322" font-family="${FONT}" font-size="78" font-weight="700" letter-spacing="-2"><tspan fill="#23201B">OneLink </tspan><tspan fill="#A87B36">Pay</tspan></text>
  <text x="505" y="412" font-family="${FONT}" font-size="52" font-weight="600" fill="#23201B">Give your AI a card.</text>
  <text x="505" y="474" font-family="${FONT}" font-size="52" font-weight="600" fill="#A87B36">Not your wallet.</text>
  <text x="505" y="544" font-family="${FONT}" font-size="23" font-weight="500" fill="#6E665C">On-chain limits · instant revoke · a proof receipt per charge</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(ROOT, "public", "og.png"));

// Verify: (1) text actually rasterized with a system font, (2) the card is not blank.
const probe = `<svg width="600" height="120" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="120" fill="#ffffff"/><text x="20" y="80" font-family="${FONT}" font-size="70" font-weight="700" fill="#000000">OneLink Pay</text></svg>`;
const probeMin = (await sharp(Buffer.from(probe)).greyscale().stats()).channels[0].min;

const og = sharp(join(ROOT, "public", "og.png"));
const meta = await og.metadata();
const ogStats = await og.greyscale().stats();
const ch = ogStats.channels[0];

console.log(`wrote public/og.png (${meta.width}x${meta.height})`);
console.log(`FONT_RENDER_CHECK min_grey=${probeMin} -> ${probeMin < 120 ? "TEXT RENDERED ✓" : "TEXT DID NOT RENDER ✗"}`);
console.log(`OG_CONTENT_CHECK min=${ch.min} max=${ch.max} -> ${ch.min < 60 && ch.max > 230 ? "HAS INK + LIGHT ✓" : "LOOKS BLANK ✗"}`);
