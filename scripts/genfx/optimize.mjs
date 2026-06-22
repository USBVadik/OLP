// Optimize generated FX assets to web-friendly webp, then remove the heavy source PNGs.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, rmSync, statSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FX = join(ROOT, "public", "fx");

const JOBS = [
  { src: "nebula.png", out: "nebula.webp", width: 1920, quality: 66 },
  { src: "aurora.png", out: "aurora.webp", width: 1920, quality: 66 },
  { src: "glow.png", out: "glow.webp", width: 256, quality: 84 },
];

for (const j of JOBS) {
  const src = join(FX, j.src);
  const out = join(FX, j.out);
  if (!existsSync(src)) {
    console.log(`skip ${j.src} (missing)`);
    continue;
  }
  await sharp(src).resize({ width: j.width, withoutEnlargement: true }).webp({ quality: j.quality }).toFile(out);
  const kb = Math.round(statSync(out).size / 1024);
  console.log(`${j.out}: ${kb} KB`);
  rmSync(src);
}
console.log("done");
