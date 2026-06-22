// Deterministic brand logo (no AI gen) — vector in the OneLink Pay palette, rasterized via sharp.
// The mark: the "O" of OneLink inside the mandate ring (the firewall bounding the account).
// Outputs:
//   public/logo.png      1024  full wordmark logo (text depends on a system sans font)
//   public/logo-mark.png  512  mark only, no text (font-independent, always safe)
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

// Shared mark (ring + ink tile + cream "O" donut). cx/cy let us reuse it at two sizes.
function mark(cx, cy) {
  return `
  <circle cx="${cx}" cy="${cy}" r="262" fill="none" stroke="#6E56F0" stroke-width="4" opacity="0.22"/>
  <circle cx="${cx}" cy="${cy}" r="232" fill="none" stroke="#A87B36" stroke-width="14" stroke-linecap="round"/>
  <rect x="${cx - 128}" y="${cy - 128}" width="256" height="256" rx="60" fill="#23201B"/>
  <circle cx="${cx}" cy="${cy}" r="80" fill="#FBF8F3"/>
  <circle cx="${cx}" cy="${cy}" r="45" fill="#23201B"/>`;
}

const bg = (s) => `
  <defs><radialGradient id="bg" cx="50%" cy="42%" r="72%">
    <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F3E9D6"/>
  </radialGradient></defs>
  <rect width="${s}" height="${s}" fill="url(#bg)"/>`;

const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${bg(1024)}
  ${mark(512, 408)}
  <text x="512" y="772" text-anchor="middle" font-family="${FONT}" font-size="94" font-weight="700" letter-spacing="-2"><tspan fill="#23201B">OneLink </tspan><tspan fill="#A87B36">Pay</tspan></text>
  <text x="512" y="840" text-anchor="middle" font-family="${FONT}" font-size="33" font-weight="500" fill="#6E665C">Give your AI a card, not your wallet.</text>
</svg>`;

// Mark-only icon: re-center the mark in a 1024 box (so r=232 fits), then downscale to 512.
const markSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  ${bg(1024)}
  ${mark(512, 512)}
</svg>`;

await sharp(Buffer.from(fullSvg)).png().toFile(join(ROOT, "public", "logo.png"));
await sharp(Buffer.from(markSvg)).resize(512, 512).png().toFile(join(ROOT, "public", "logo-mark.png"));

// Definitive font check: render text only; if a glyph rasterized there will be dark pixels.
const probe = `<svg width="600" height="120" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="120" fill="#ffffff"/><text x="20" y="80" font-family="${FONT}" font-size="70" font-weight="700" fill="#000000">OneLink Pay</text></svg>`;
const stats = await sharp(Buffer.from(probe)).greyscale().stats();
const min = stats.channels[0].min; // 0 = pure black glyph present, 255 = nothing drawn
console.log(`wrote public/logo.png (1024) + public/logo-mark.png (512)`);
console.log(`FONT_RENDER_CHECK min_grey=${min} -> ${min < 120 ? "TEXT RENDERED ✓" : "TEXT DID NOT RENDER ✗ (use logo-mark.png)"}`);
