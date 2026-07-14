import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParticleActivityProof } from "./particle-activity-proof";

// The Next.js build uses the automatic JSX runtime. The standalone tsx test runner compiles the
// existing shared UI module with the classic runtime, so expose React for this isolated render.
Object.assign(globalThis, { React });

test("renders verified Particle UA execution proof with route and activity link", () => {
  const html = renderToStaticMarkup(
    ParticleActivityProof({
      activityId: "0x0655f16e0cd6c8",
      href: "https://universalx.app/activity/details?id=0x0655f16e0cd6c8",
      sourceNames: ["Base"],
      settlementName: "Arbitrum One",
      verified: true,
    }),
  );

  assert.match(html, /Particle Network proof/);
  assert.match(html, /Executed by Particle Universal Account/);
  assert.match(html, /FINISHED/);
  assert.match(html, /EIP-7702/);
  assert.match(html, /Base source leg/);
  assert.match(html, /Arbitrum One settlement/);
  assert.match(html, /Open Particle explorer/);
  assert.match(html, /universalx\.app\/activity\/details\?id=0x0655f16e0cd6c8/);
});

test("renders no Particle proof without a UA transaction id", () => {
  const html = renderToStaticMarkup(
    ParticleActivityProof({
      activityId: null,
      href: null,
      verified: false,
    }),
  );

  assert.equal(html, "");
});
