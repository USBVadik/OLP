/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Warm premium light palette — paper, ink, and a restrained gold/emerald.
        canvas: "#F7F4EF",
        paper: "#FFFFFF",
        paper2: "#FBF9F5",
        ink: "#23201B",
        ink2: "#4A443C",
        muted: "#6E665C",
        faint: "#9A9286",
        line: "#ECE6DC",
        line2: "#E0D8CA",
        cream: "#FBF8F3",
        gold: "#A87B36",
        "gold-soft": "#F3E9D6",
        verify: "#1F7A53",
        "verify-soft": "#E7F2EB",
        danger: "#B4452F",
        "danger-soft": "#F7E7E1",
        // Located Particle-aligned accent (violet/iris) — used around Universal Account
        // touchpoints and the particle-field signature, never as a full reskin.
        iris: "#6E56F0",
        "iris-2": "#9B86FF",
        "iris-soft": "#ECE9FD",
        "iris-ink": "#2A2350",
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "ui-serif", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,32,27,0.04), 0 10px 30px -16px rgba(35,32,27,0.18)",
        lift: "0 2px 6px rgba(35,32,27,0.06), 0 24px 48px -24px rgba(35,32,27,0.28)",
        seal: "0 0 0 1px rgba(168,123,54,0.25), 0 12px 30px -12px rgba(168,123,54,0.35)",
        glow: "0 0 0 1px rgba(110,86,240,0.25), 0 18px 50px -18px rgba(110,86,240,0.45)",
        "glow-gold": "0 0 0 1px rgba(168,123,54,0.25), 0 18px 50px -18px rgba(168,123,54,0.40)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sealPop: {
          "0%": { opacity: "0", transform: "scale(0.82)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(110,86,240,0.0)" },
          "50%": { boxShadow: "0 0 0 6px rgba(110,86,240,0.10)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blockPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(180,69,47,0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(180,69,47,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(180,69,47,0)" },
        },
        drawLine: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.21,0.6,0.35,1) both",
        seal: "sealPop 0.6s cubic-bezier(0.21,0.8,0.3,1) both",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        "float-y": "floatY 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        "block-pulse": "blockPulse 0.7s cubic-bezier(0.21,0.8,0.3,1) 1",
        "draw-line": "drawLine 0.7s cubic-bezier(0.21,0.8,0.3,1) 0.45s both",
        "count-up": "countUp 0.5s cubic-bezier(0.21,0.6,0.35,1) both",
      },
    },
  },
  plugins: [],
};
