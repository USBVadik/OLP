// Generate premium visual FX assets via Vertex AI (Nano Banana Pro / Gemini 3 Pro Image).
// The service-account JSON stays gitignored; this script reads it locally and never prints it.
//
// Usage:
//   node scripts/genfx/generate.mjs               # generate all specs
//   node scripts/genfx/generate.mjs nebula        # generate one spec by key
//
// Output: public/fx/<key>.png

import { GoogleAuth } from "google-auth-library";
import { writeFileSync, mkdirSync, existsSync, statSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG = join(__dirname, "run.log");
const diag = (m) => {
  const line = typeof m === "string" ? m : JSON.stringify(m);
  appendFileSync(LOG, line + "\n");
  console.log(line);
};
process.on("uncaughtException", (e) => {
  try { appendFileSync(LOG, "UNCAUGHT " + (e?.stack || e) + "\n"); } catch {}
});
process.on("unhandledRejection", (e) => {
  try { appendFileSync(LOG, "UNHANDLED " + (e?.stack || e) + "\n"); } catch {}
});
process.on("exit", (c) => {
  try { appendFileSync(LOG, "EXIT " + c + "\n"); } catch {}
});
const ROOT = join(__dirname, "..", "..");
const KEY_FILE = join(ROOT, "ffsgen-0abb2001ddd9.json");
const OUT_DIR = join(ROOT, "public", "fx");
const PROJECT = "ffsgen";
const MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro
const ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`;

// Palette anchor for every prompt: warm cream + deep ink, restrained gold (#A87B36) and
// Particle violet (#6E56F0). Abstract, premium, editorial — never literal/clip-arty.
const SPECS = {
  nebula: {
    aspect: "16:9",
    prompt:
      "Abstract cinematic dark nebula texture for a premium website background. Deep near-black charcoal base (#16140f) with elegant soft flares of warm gold (#A87B36) and electric violet (#6E56F0) light, fine luminous particles and faint constellation lines drifting through deep space, subtle volumetric glow, refined and minimal, high detail, no text, no logos, editorial art direction, 8k.",
  },
  glow: {
    aspect: "1:1",
    prompt:
      "A single soft glowing particle orb on pure black background, radial bloom, warm gold core fading to a violet halo, smooth bokeh, additive light, centered, no text, high detail. Pure #000000 background for additive compositing.",
  },
  aurora: {
    aspect: "16:9",
    prompt:
      "Very subtle abstract aurora texture on a warm cream background (#F7F4EF), faint diffuse ribbons of soft gold (#A87B36) and gentle violet (#6E56F0) light, extremely light and airy, premium editorial, minimal, lots of negative space, no text, no logos, high detail.",
  },
};

async function main() {
  if (!existsSync(KEY_FILE)) {
    console.error(`Key file not found at ${KEY_FILE}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const which = process.argv.slice(2);
  const keys = which.length ? which : Object.keys(SPECS);

  const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  if (!token) {
    console.error("Failed to mint an access token from the service account.");
    process.exit(1);
  }
  console.log("Auth OK. Generating:", keys.join(", "));

  for (const key of keys) {
    const spec = SPECS[key];
    if (!spec) {
      console.error(`Unknown spec "${key}". Known: ${Object.keys(SPECS).join(", ")}`);
      continue;
    }
    const body = {
      contents: [{ role: "user", parts: [{ text: spec.prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: spec.aspect, imageSize: "2K" },
      },
    };

    const t0 = Date.now();
    diag(`[${key}] POST ${MODEL} (${spec.aspect})...`);
    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      diag(`[${key}] FETCH THREW: ${e?.message ?? e}`);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      diag(`[${key}] HTTP ${res.status}: ${errText.slice(0, 1200)}`);
      continue;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inlineData?.data);
    if (!imgPart) {
      diag(`[${key}] No image part. finishReason=${data?.candidates?.[0]?.finishReason}. parts=${JSON.stringify(parts).slice(0, 400)}`);
      continue;
    }
    const out = join(OUT_DIR, `${key}.png`);
    writeFileSync(out, Buffer.from(imgPart.inlineData.data, "base64"));
    const kb = Math.round(statSync(out).size / 1024);
    diag(`[${key}] saved ${out} (${kb} KB) in ${Date.now() - t0}ms`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e?.message ?? e);
  process.exit(1);
});
