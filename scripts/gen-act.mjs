// One-off asset generator for the "Bounded autonomy" scroll section.
// Uses the local Google service-account (gitignored) to call Vertex AI's
// Nano Banana Pro (gemini-3-pro-image-preview) and writes optimized webp
// backgrounds into public/fx/.
//
// BUILD-TIME ONLY. Nothing here ships to the deployed app: no credentials,
// no Vertex calls at runtime — just the static webp images it produces.
//
// Produces 4 ATMOSPHERIC act backgrounds (no ring/geometry — the canvas draws
// the ring/agent/nodes on top). The first is an anchor; acts 2-4 reference it
// (a small downscaled copy) so the whole set shares one cosmic "world".
//
// Run:  node scripts/gen-act.mjs

import { GoogleAuth } from "google-auth-library";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

process.on("unhandledRejection", (e) => {
  console.error("UNHANDLED_REJECTION:", e?.stack || e);
  process.exit(1);
});
process.on("uncaughtException", (e) => {
  console.error("UNCAUGHT_EXCEPTION:", e?.stack || e);
  process.exit(1);
});

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./ffsgen-0abb2001ddd9.json";
const LOCATION = process.env.VERTEX_LOCATION || "global";
const MODEL = process.env.VERTEX_IMAGE_MODEL || "gemini-3-pro-image-preview";
const OUT_DIR = "public/fx";
const OUT_WIDTH = 1376; // full-bleed background; native model output width

const STYLE =
  "Cinematic abstract cosmic ATMOSPHERE for a premium fintech hero background, " +
  "ultra-detailed, photoreal render quality, 16:9. Palette: deep warm near-black space " +
  "(#13110d), soft golden nebula, fine scattered stars, subtle dust lanes, gentle " +
  "volumetric light, delicate film grain. Restrained, elegant, high-end. Strictly " +
  "atmosphere only: NO ring, NO circle, NO orbit, NO connecting lines, NO nodes or dots " +
  "arranged as a diagram, NO geometry, NO text, NO letters, NO numbers, NO logos, NO UI, " +
  "NO charts, NO people, NO hands. Keep the CENTER darker and clean as negative space for " +
  "overlaid headline text. ";

const ANCHOR = {
  name: "act1-consent",
  mood:
    "Mood: calm, controlled, trustworthy — a quiet dawn in deep space, a soft warm golden " +
    "glow rising gently from the lower center, serene and still.",
};

const VARIATIONS = [
  {
    name: "act2-spend",
    mood:
      "Mood: gentle outward energy and flow — faint golden and violet-indigo (#6E56F0) light " +
      "currents drifting outward across the field, more luminous and alive, warm and expansive.",
  },
  {
    name: "act3-blocked",
    mood:
      "Mood: tension and a hard limit reached — a deep crimson-red (#B4452F) glow with a charged " +
      "red haze pushing in from the right, scattered embers, dramatic but tasteful, the calm disturbed.",
  },
  {
    name: "act4-proof",
    mood:
      "Mood: resolved and serene — a calm emerald-green (#1F7A53) aura softly blended with the gold, " +
      "settled dust, a clean reassuring afterglow, peace after the storm.",
  },
];

let endpoint;

async function getToken() {
  const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("failed to mint access token");
  return token;
}

async function generate(token, parts) {
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };
  console.log(`  POST ${MODEL} (${parts.length} part(s))...`);
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`fetch failed: ${e?.message || e}`);
  }
  console.log(`  <- HTTP ${res.status} in ${Date.now() - t0}ms`);
  const raw = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0, 1500)}`);
  const json = JSON.parse(raw);
  const ps = json?.candidates?.[0]?.content?.parts || [];
  for (const p of ps) {
    if (p.inlineData?.data) {
      return { buf: Buffer.from(p.inlineData.data, "base64"), mime: p.inlineData.mimeType || "image/png" };
    }
  }
  throw new Error(`no image returned. raw: ${raw.slice(0, 1200)}`);
}

async function saveWebp(buf, name) {
  const out = path.join(OUT_DIR, `${name}.webp`);
  await sharp(buf).resize({ width: OUT_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  const meta = await sharp(out).metadata();
  console.log(`  saved ${out} (${kb} KB, ${meta.width}x${meta.height})`);
}

async function main() {
  const sa = JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
  const project = sa.project_id;
  const host = LOCATION === "global" ? "aiplatform.googleapis.com" : `${LOCATION}-aiplatform.googleapis.com`;
  endpoint = `https://${host}/v1/projects/${project}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

  console.log(`model=${MODEL} location=${LOCATION} project=${project}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const token = await getToken();

  // Anchor — defines the world.
  console.log(`\n[${ANCHOR.name}] generating anchor...`);
  const anchor = await generate(token, [{ text: STYLE + ANCHOR.mood }]);
  await saveWebp(anchor.buf, ANCHOR.name);

  // Small downscaled reference so the variation requests stay light.
  const refBuf = await sharp(anchor.buf).resize({ width: 768 }).jpeg({ quality: 70 }).toBuffer();
  const refB64 = refBuf.toString("base64");

  // Variations — same world, different mood/energy.
  for (const v of VARIATIONS) {
    console.log(`\n[${v.name}] generating (referencing anchor)...`);
    const parts = [
      { inlineData: { mimeType: "image/jpeg", data: refB64 } },
      {
        text:
          "Keep the exact same cosmic world, composition, palette and film grain as the reference " +
          "image. Change ONLY the mood/energy as follows. " +
          v.mood +
          " Still strictly atmosphere only: NO ring, NO lines, NO nodes, NO geometry, NO text. " +
          "Keep the center darker for overlaid text. 16:9.",
      },
    ];
    const img = await generate(token, parts);
    await saveWebp(img.buf, v.name);
  }

  // Remove the earlier raw PoC PNG if it's still around.
  const oldPng = path.join(OUT_DIR, "act1-consent.png");
  if (fs.existsSync(oldPng)) {
    fs.unlinkSync(oldPng);
    console.log(`\nremoved stale ${oldPng}`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
