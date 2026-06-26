"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Bounded autonomy" — the signature scroll-driven film. A pinned canvas scene whose
 * scroll progress (0→1) deterministically scrubs four acts of the product story:
 *
 *   1. Consent      — the mandate ring draws itself; the agent appears, tethered.
 *   2. Spend within — the agent fires value pulses to chain nodes; budget depletes.
 *   3. Blocked      — it lunges past the cap, strikes the ring (red shockwave), snaps back.
 *   4. Proof/revoke — a proof seal stamps; the tether is cut.
 *
 * Deterministic (progress-driven, fully scrubbable both directions). Palette stays ours
 * (ink/gold + Particle-iris, danger-red for the block). Reduced motion → a static,
 * non-pinned stack of the four beats.
 */

const BEATS = [
  { k: "Consent", h: "Sign one scoped mandate.", s: "Per-charge, daily, and total caps. One signature." },
  { k: "Spend", h: "It pays — across any chain.", s: "Your agent draws from one Universal Account balance." },
  { k: "Blocked", h: "It cannot overpay.", s: "Over-cap charges hit the wall and revert on-chain. Zero gas." },
  { k: "Proof", h: "Proof recorded. Revoke anytime.", s: "Every payment ships a verifiable receipt. You hold the kill switch." },
];

// Per-act cinematic backgrounds (Nano Banana Pro / Vertex AI). Atmosphere only — the ring,
// agent and nodes are drawn by the canvas on top. Index matches BEATS / the active beat.
const ACT_BG = [
  "/fx/act1-consent.webp",
  "/fx/act2-spend.webp",
  "/fx/act3-blocked.webp",
  "/fx/act4-proof.webp",
];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
function band(x: number, start: number, end: number, fade = 0.06) {
  return smoothstep(start - fade, start + fade, x) * (1 - smoothstep(end - fade, end + fade, x));
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The lunge curve across act 3, driven by a LINEAR local progress u in [0,1] (so the
 * crafted easing below reads correctly): a little anticipation (coil inward), a fast lunge
 * OUT to the wall, a hard recoil back through idle, then settle to 0. Returns a radial
 * multiplier applied to the agent's distance from center (1 ≈ at the ring).
 */
function lungeReach(u: number): number {
  if (u <= 0) return 0;
  if (u < 0.3) return -0.12 * Math.sin((u / 0.3) * Math.PI); // anticipation: coil inward
  if (u < 0.5) return easeOutCubic((u - 0.3) / 0.2) * 1.08; // lunge out to the wall
  if (u < 0.68) return 1.08 - easeOutCubic((u - 0.5) / 0.18) * 1.26; // recoil back through idle
  return -0.18 * (1 - easeOutCubic((u - 0.68) / 0.32)); // settle to idle
}

const GOLD = "168,123,54";
const IRIS = "110,86,240";
const RED = "180,69,47";

export function ScrollNarrative() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reduce, setReduce] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setReduce(true);
      return;
    }
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = true;
    const start = performance.now();
    // Eased scroll progress: instead of reading the raw scroll position (which jumps with
    // each wheel/trackpad tick), the motion glides toward the target each frame, so every
    // act transitions smoothly rather than in sudden steps. Snaps to target on first frame.
    let pSmooth = -1;
    let lastT = start;

    // Soft glow sprites pre-rendered offscreen: radial gradients with transparent edges →
    // clean additive bloom, NO square artifacts. (An AI image sprite isn't pure-black enough
    // for additive compositing — hand-crafted gradients are the right tool here.)
    const makeGlow = (rgb: string) => {
      const g = document.createElement("canvas");
      g.width = 128;
      g.height = 128;
      const gc = g.getContext("2d");
      if (gc) {
        const grd = gc.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, `rgba(${rgb},0.8)`);
        grd.addColorStop(0.25, `rgba(${rgb},0.3)`);
        grd.addColorStop(1, `rgba(${rgb},0)`);
        gc.fillStyle = grd;
        gc.fillRect(0, 0, 128, 128);
      }
      return g;
    };
    const glowGold = makeGlow(GOLD);
    const glowIris = makeGlow(IRIS);
    const glowRed = makeGlow(RED);
    let amb: {
      x: number;
      y: number;
      bx: number;
      by: number;
      ix: number;
      iy: number;
      s: number;
      a: number;
      iris: boolean;
    }[] = [];
    // Recent agent positions → a comet trail that stretches during the lunge.
    const trail: { x: number; y: number }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Cap device-pixel-ratio: on Retina (dpr 2) a full-screen canvas re-uploads a ~4x
      // texture to the GPU every frame, which is a dominant scroll-time cost. 1.25 keeps
      // the soft glowy scene looking fine while cutting raster + upload cost further.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      amb = Array.from({ length: 10 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        bx: (Math.random() - 0.5) * 0.16,
        by: (Math.random() - 0.5) * 0.16,
        ix: 0,
        iy: 0,
        s: 40 + Math.random() * 120,
        a: 0.2 + Math.random() * 0.28,
        iris: Math.random() < 0.5,
      }));
    };

    const progress = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return 0;
      return clamp(-rect.top / total, 0, 1);
    };

    let lastActive = -1;

    const draw = () => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05); // clamp so a tab-away can't cause a jump
      lastT = now;
      const pTarget = progress();
      // Frame-rate-independent exponential smoothing (behaves the same at 60 and 120 Hz).
      // Lower rate = more glide (smoother, but lags scroll a touch more); higher = snappier.
      // Tuned 5 -> 3 for a more cinematic glide that hides chunky wheel/trackpad steps.
      if (pSmooth < 0) pSmooth = pTarget;
      else pSmooth += (pTarget - pSmooth) * (1 - Math.exp(-dt * 3));
      const p = pSmooth;
      const time = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // ---- Geometry + acts (subtle camera drift as you scroll) ----
      const cx = w / 2;
      const cy = h * 0.62 - p * 22;
      const R = Math.min(w, h) * 0.24;

      const a1 = smoothstep(0.02, 0.24, p); // ring draws + agent appears
      const a2 = smoothstep(0.26, 0.54, p); // spend
      const a3 = smoothstep(0.56, 0.82, p); // block
      const a4 = smoothstep(0.84, 0.98, p); // proof/revoke

      // ---- Climax choreography: driven by a LINEAR local progress so the easing reads right ----
      const lungeAng = -Math.PI / 6;
      const u3 = clamp((p - 0.56) / 0.26, 0, 1); // 0→1 across the "blocked" act
      const reach = lungeReach(u3);
      const strike = band(u3, 0.46, 0.56, 0.04); // the sharp white flash at the instant of impact
      // Shockwave that expands and fades AFTER impact, so it stays visible at normal scroll speed.
      const shockT = clamp((u3 - 0.5) / 0.36, 0, 1);
      const shock = u3 > 0.5 ? 1 - shockT : 0; // 1 at impact → 0 as the wave dissipates
      const blockedHold = smoothstep(0.5, 0.58, u3) * (1 - a4); // hold the red "blocked" state through act 3 so a paused frame reads clearly
      const impactX = cx + Math.cos(lungeAng) * R;
      const impactY = cy + Math.sin(lungeAng) * R;
      const tremble = strike + shock > 0.01 ? Math.sin(time * 46) * 3 * (strike + shock * 0.6) : 0;

      // ---- Ambient soft glow particles (additive); scatter outward from the strike ----
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const a of amb) {
        const blast = strike * 1.2 + shock * 0.5;
        if (blast > 0.05) {
          const dx = a.x - impactX;
          const dy = a.y - impactY;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 320) {
            const f = (1 - d / 320) * blast;
            a.ix += (dx / d) * f;
            a.iy += (dy / d) * f;
          }
        }
        a.ix *= 0.93;
        a.iy *= 0.93;
        a.x += a.bx + a.ix;
        a.y += a.by + a.iy;
        if (a.x < -a.s) a.x = w + a.s;
        else if (a.x > w + a.s) a.x = -a.s;
        if (a.y < -a.s) a.y = h + a.s;
        else if (a.y > h + a.s) a.y = -a.s;
        ctx.globalAlpha = a.a;
        ctx.drawImage(a.iris ? glowIris : glowGold, a.x - a.s / 2, a.y - a.s / 2, a.s, a.s);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ---- Chain nodes around the ring ----
      const nodes = [
        { ang: -Math.PI / 2 - 0.5, label: "Base" },
        { ang: lungeAng, label: "Arbitrum" },
        { ang: Math.PI - 0.5, label: "API" },
      ];
      const nodePos = nodes.map((n) => ({
        x: cx + Math.cos(n.ang) * R * 1.5,
        y: cy + Math.sin(n.ang) * R * 1.5,
        label: n.label,
      }));
      for (const np of nodePos) {
        ctx.strokeStyle = `rgba(245,240,232,${0.08 * a1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(np.x, np.y);
        ctx.stroke();
        ctx.save();
        ctx.globalAlpha = a1;
        ctx.fillStyle = `rgba(${GOLD},0.85)`;
        ctx.beginPath();
        ctx.arc(np.x, np.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(245,240,232,0.6)`;
        ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(np.label, np.x, np.y - 10);
        ctx.restore();
      }

      // ---- Faint full track ring (always present → structure from the very first frame) ----
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${GOLD},0.13)`;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ---- Mandate ring (draws in act 1; trembles + flushes red through the strike) ----
      const ringRed = clamp(strike + shock * 0.7 + blockedHold * 0.55, 0, 1);
      const ringRGB = ringRed > 0.05 ? RED : GOLD;
      const ringStart = -Math.PI / 2;
      const ringEnd = -Math.PI / 2 + a1 * Math.PI * 2;
      // Soft halo via a wide, low-alpha additive stroke instead of a per-frame shadowBlur pass.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 2 + ringRed * 1.5 + 10 + ringRed * 10;
      ctx.strokeStyle = `rgba(${ringRGB},${0.12 + ringRed * 0.2})`;
      ctx.beginPath();
      ctx.arc(cx, cy, R + tremble, ringStart, ringEnd);
      ctx.stroke();
      ctx.restore();
      // Crisp ring on top.
      ctx.save();
      ctx.lineWidth = 2 + ringRed * 1.5;
      ctx.strokeStyle = `rgba(${ringRGB},${0.5 + ringRed * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, R + tremble, ringStart, ringEnd);
      ctx.stroke();
      ctx.restore();

      // ---- Remaining-budget arc (depletes during spend) ----
      const remaining = clamp(1 - a2 * 0.55 - a3 * 0.1, 0, 1);
      if (a1 > 0.4) {
        const budgetEnd = -Math.PI / 2 + remaining * Math.PI * 2;
        // halo underlay (additive) replaces shadowBlur
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        ctx.lineWidth = 11;
        ctx.strokeStyle = `rgba(${IRIS},${0.14 * a1})`;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.78, -Math.PI / 2, budgetEnd);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(${IRIS},${0.55 * a1})`;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.78, -Math.PI / 2, budgetEnd);
        ctx.stroke();
        ctx.restore();
      }

      // ---- Value pulses (center → nodes), swelling as they arrive ----
      if (a2 > 0.02 && a3 < 0.5) {
        for (let i = 0; i < nodePos.length; i++) {
          const np = nodePos[i];
          const t = (time * 0.5 + i / nodePos.length) % 1;
          const flowing = a2 * (1 - a3);
          if (flowing < 0.05) continue;
          const x = cx + (np.x - cx) * t;
          const y = cy + (np.y - cy) * t;
          const pr = 2.2 + (1 - t) * 1.2;
          ctx.save();
          ctx.globalAlpha = flowing * (1 - t) * 1.2;
          // soft bloom via the pre-rendered gold sprite instead of shadowBlur
          ctx.globalCompositeOperation = "lighter";
          const gs = pr * 7;
          ctx.drawImage(glowGold, x - gs / 2, y - gs / 2, gs, gs);
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = `rgba(${GOLD},0.95)`;
          ctx.beginPath();
          ctx.arc(x, y, pr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ---- Agent: idle bob; anticipation → lunge → recoil → settle ----
      const bob = Math.sin(time * 1.4) * 4 * a1;
      const idleR = R * 0.34;
      const agentDist = idleR + reach * (R * 1.04 - idleR);
      const ax = cx + Math.cos(lungeAng) * agentDist;
      const ay = cy + Math.sin(lungeAng) * agentDist + bob * (1 - a3);
      const agentRed = clamp(strike + shock * 0.6 + blockedHold * 0.5, 0, 1);
      const agentColor = agentRed > 0.1 ? RED : IRIS;

      // Comet trail — faint at idle, stretches into a streak through the lunge.
      trail.push({ x: ax, y: ay });
      if (trail.length > 16) trail.shift();
      if (a1 > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < trail.length; i++) {
          const f = i / trail.length;
          ctx.globalAlpha = f * f * 0.5 * a1;
          ctx.fillStyle = `rgba(${agentColor},0.9)`;
          ctx.beginPath();
          ctx.arc(trail[i].x, trail[i].y, 0.8 + f * 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Tether (leash) center → agent; cut during act 4.
      if (a1 > 0.2) {
        const cut = a4;
        ctx.strokeStyle = `rgba(${IRIS},${0.55 * a1 * (1 - cut)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (ax - cx) * (1 - cut * 0.5), cy + (ay - cy) * (1 - cut * 0.5));
        ctx.stroke();
      }

      // Expanding red shockwave that lingers AFTER impact (visible at normal scroll speed).
      if (shock > 0.001) {
        const ringMax = R * 1.9;
        ctx.save();
        ctx.strokeStyle = `rgba(${RED},0.95)`;
        ctx.globalAlpha = shock * 0.85;
        ctx.lineWidth = 1 + shock * 5;
        ctx.beginPath();
        ctx.arc(impactX, impactY, 8 + shockT * ringMax, 0, Math.PI * 2);
        ctx.stroke();
        // a second, faster-expanding ring for depth
        ctx.globalAlpha = shock * 0.45;
        ctx.lineWidth = 1 + shock * 3;
        ctx.beginPath();
        ctx.arc(impactX, impactY, 8 + shockT * ringMax * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Hot white-gold core flash at the instant of impact.
      if (strike > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = strike;
        const fr = 30 + strike * 70;
        const fl = ctx.createRadialGradient(impactX, impactY, 0, impactX, impactY, fr);
        fl.addColorStop(0, "rgba(255,250,240,1)");
        fl.addColorStop(0.35, `rgba(${GOLD},0.6)`);
        fl.addColorStop(1, "rgba(255,247,235,0)");
        ctx.fillStyle = fl;
        ctx.beginPath();
        ctx.arc(impactX, impactY, fr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Agent body — soft bloom via a pre-rendered glow sprite (no per-frame shadowBlur).
      const agentR = 6 + Math.max(0, reach) * 2;
      const agentGlow = agentColor === RED ? glowRed : glowIris;
      ctx.save();
      ctx.globalAlpha = a1 * (1 - a4 * 0.15);
      ctx.globalCompositeOperation = "lighter";
      const ags = (agentR + 14 + strike * 16) * 2.4;
      ctx.drawImage(agentGlow, ax - ags / 2, ay - ags / 2, ags, ags);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(${agentColor},0.95)`;
      ctx.beginPath();
      ctx.arc(ax, ay, agentR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Proof seal in the center during act 4.
      if (a4 > 0.05) {
        ctx.save();
        ctx.globalAlpha = a4;
        ctx.strokeStyle = `rgba(${"31,122,83"},0.9)`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy);
        ctx.lineTo(cx - 1.5, cy + 5);
        ctx.lineTo(cx + 7, cy - 6);
        ctx.stroke();
        ctx.restore();
      }

      // (Edge vignette moved to a static CSS overlay — see JSX below — so we no longer repaint
      // a full-screen radial gradient on the canvas every frame while scrolling.)

      // Drive the active beat for the text overlay.
      const act = p < 0.26 ? 0 : p < 0.55 ? 1 : p < 0.8 ? 2 : 3;
      if (act !== lastActive) {
        lastActive = act;
        setActive(act);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver((e) => (onScreen = e[0]?.isIntersecting ?? true), {
      threshold: 0,
    });
    io.observe(track);
    const loop = () => {
      if (onScreen) draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (reduce) {
    return (
      <section className="mt-24" aria-label="How OneLink Pay bounds an agent">
        <span className="op-eyebrow">Bounded autonomy</span>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
          The agent can pay. It cannot overpay.
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {BEATS.map((b) => (
            <div key={b.k} className="op-card-quiet p-4">
              <p className="op-eyebrow">{b.k}</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{b.h}</p>
              <p className="mt-1 text-sm text-muted">{b.s}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={trackRef} className="relative mt-24 h-[380vh]" aria-label="How OneLink Pay bounds an agent">
      {/* Luminous horizon instead of a muddy cream→dark fade: a crisp line of light where
          the cosmos begins/ends. The warm glow falls into the dark (gold on black is
          luminous, never grey); the cream side stays clean. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gold/20 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gold/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      </div>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-start overflow-hidden">
        {/* Cinematic cosmic backdrop — generated per-act art (Nano Banana Pro), crossfaded by
            the active beat with a slow Ken Burns drift. Geometry (ring/agent/nodes) is drawn by
            the canvas on top. */}
        <div className="absolute inset-0 bg-[#13110d]" aria-hidden="true">
          {ACT_BG.map((src, i) => {
            // eslint-disable-next-line @next/next/no-img-element
            return (
              <img
                key={src}
                src={src}
                alt=""
                className={`act-bg act-bg-${i + 1} absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${
                  active === i ? "opacity-[0.62]" : "opacity-0"
                }`}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-[#13110d]/80 via-[#13110d]/10 to-[#13110d]/95" />
        </div>

        <style jsx>{`
          .act-bg {
            animation: actKenBurns 28s ease-in-out infinite alternate;
            will-change: transform, opacity;
          }
          .act-bg-2 {
            animation-delay: -7s;
          }
          .act-bg-3 {
            animation-delay: -14s;
          }
          .act-bg-4 {
            animation-delay: -21s;
          }
          @keyframes actKenBurns {
            from {
              transform: scale(1.08) translate3d(-1.5%, 1%, 0);
            }
            to {
              transform: scale(1.16) translate3d(1.5%, -1.5%, 0);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .act-bg {
              animation: none;
              transform: scale(1.08);
            }
          }
        `}</style>

        {/* Beat text */}
        <div className="relative z-10 mx-auto max-w-2xl px-5 pt-[12vh] text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">
            Bounded autonomy
          </span>
          <div className="relative mt-2 h-[7.5rem] sm:h-[8.5rem]">
            {BEATS.map((b, i) => (
              <div
                key={b.k}
                className={`absolute inset-x-0 top-0 transition-all duration-500 ease-out ${
                  active === i ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
                }`}
              >
                <h2 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.01em] text-cream sm:text-5xl">
                  {b.h}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/65 sm:text-base">{b.s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The film */}
        <canvas ref={canvasRef} className="absolute inset-0 z-[5] h-full w-full" aria-hidden="true" />

        {/* Static edge vignette — was repainted on the canvas every frame; moved to a CSS
            overlay so scrubbing stays at full frame rate while scrolling. Sits above the
            canvas (z-[5]) and below the text (z-10). */}
        <div
          className="pointer-events-none absolute inset-0 z-[6]"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 30%, rgba(10,8,6,0.18) 62%, rgba(8,7,5,0.62) 100%)",
          }}
        />

        {/* Scroll progress dots */}
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {BEATS.map((b, i) => (
            <span
              key={b.k}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === i ? "w-6 bg-gold" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
