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
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.21,0.6,0.35,1) both",
        seal: "sealPop 0.6s cubic-bezier(0.21,0.8,0.3,1) both",
      },
    },
  },
  plugins: [],
};
