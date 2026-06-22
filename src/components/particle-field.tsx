"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Positioning / sizing classes for the absolutely-placed canvas wrapper. */
  className?: string;
  /** Particles per ~14k px²; clamped to [22, 84]. Lower = quieter. */
  density?: number;
};

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  iris: boolean;
  hub: boolean;
  phase: number;
};

type Pulse = { a: number; b: number; t: number; speed: number; iris: boolean };

// OneLink palette, not the white-on-dark cliché: gold + Particle-violet on warm cream.
const GOLD = "168,123,54";
const IRIS = "110,86,240";
const LINK = 124; // px before two nodes stop being linked
const LINK_SQ = LINK * LINK;
const CURSOR = 170; // px cursor influence radius
const CURSOR_SQ = CURSOR * CURSOR;

/**
 * A living constellation — our "Particle" signature. Particles drift, link when near,
 * and react to the cursor (nodes lean in, links draw to the pointer). Bright "value
 * pulses" periodically travel along links — a nod to value moving across the network.
 *
 * Pure canvas (no deps), DPR-aware, pauses when hidden/off-screen, and respects reduced
 * motion by drawing a single static frame instead of looping.
 */
export function ParticleField({ className = "", density = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let particles: P[] = [];
    let pulses: Pulse[] = [];
    let raf = 0;
    let running = true;
    let onScreen = true;
    let frame = 0;
    const pointer = { x: 0, y: 0, active: false };

    const seed = () => {
      const target = Math.round((width * height) / 14000) * density;
      const count = Math.max(22, Math.min(84, target));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 0.8 + Math.random() * 1.7,
        iris: Math.random() < 0.44,
        hub: i % 11 === 0, // a few glowing hub nodes
        phase: Math.random() * Math.PI * 2,
      }));
      pulses = Array.from({ length: Math.max(3, Math.min(6, Math.round(count / 12))) }, () =>
        spawnPulse()
      );
    };

    const spawnPulse = (): Pulse => {
      // Ride an existing link when possible, else any near pair.
      for (let tries = 0; tries < 8; tries++) {
        const a = (Math.random() * particles.length) | 0;
        const b = (Math.random() * particles.length) | 0;
        if (a === b) continue;
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        if (dx * dx + dy * dy < LINK_SQ) {
          return { a, b, t: 0, speed: 0.006 + Math.random() * 0.012, iris: Math.random() < 0.5 };
        }
      }
      return { a: 0, b: 1, t: 0, speed: 0.01, iris: Math.random() < 0.5 };
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Links between particles.
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_SQ) continue;
          const alpha = (1 - d2 / LINK_SQ) * 0.2;
          ctx.strokeStyle = `rgba(${IRIS},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Cursor links — the "live network reaches for you" moment.
      if (pointer.active) {
        for (const p of particles) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > CURSOR_SQ) continue;
          const alpha = (1 - d2 / CURSOR_SQ) * 0.5;
          ctx.strokeStyle = `rgba(${IRIS},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      // Value pulses traveling along links.
      for (const pulse of pulses) {
        const a = particles[pulse.a];
        const b = particles[pulse.b];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * pulse.t;
        const y = a.y + (b.y - a.y) * pulse.t;
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${pulse.iris ? IRIS : GOLD},0.9)`;
        ctx.fillStyle = `rgba(${pulse.iris ? IRIS : GOLD},0.95)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Dots (hubs glow).
      for (const p of particles) {
        const base = p.iris ? IRIS : GOLD;
        if (p.hub) {
          const pr = p.r + 1.2 + Math.sin(frame * 0.04 + p.phase) * 0.6;
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${base},0.8)`;
          ctx.fillStyle = `rgba(${base},0.72)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = `rgba(${base},${p.iris ? 0.55 : 0.48})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const step = () => {
      if (!running || !onScreen) return;
      frame++;
      for (const p of particles) {
        // Gentle cursor attraction.
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CURSOR_SQ && d2 > 1) {
            const f = (1 - d2 / CURSOR_SQ) * 0.035;
            p.vx += (dx / Math.sqrt(d2)) * f;
            p.vy += (dy / Math.sqrt(d2)) * f;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        // Damping so cursor nudges don't accumulate.
        p.vx *= 0.98;
        p.vy *= 0.98;
        // Keep a floor of drift so it never goes static.
        if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.04;
        if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.04;
        if (p.x < -8) p.x = width + 8;
        else if (p.x > width + 8) p.x = -8;
        if (p.y < -8) p.y = height + 8;
        else if (p.y > height + 8) p.y = -8;
      }
      for (let i = 0; i < pulses.length; i++) {
        pulses[i].t += pulses[i].speed;
        if (pulses[i].t >= 1) pulses[i] = spawnPulse();
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen && running && !reduceMotion) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0 }
    );
    if (canvas.parentElement) io.observe(canvas.parentElement);

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
    };
    const onMove = (e: MouseEvent) => {
      toLocal(e.clientX, e.clientY);
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    if (!reduceMotion) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave, { passive: true });
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
