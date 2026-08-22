/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-soft": "var(--panel-soft)",
        border: "var(--border)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        amber: "var(--amber)",
        violet: "var(--violet)",
        green: "var(--green)",
        red: "var(--red)",
      },
      boxShadow: {
        glow: "0 0 0 1px var(--border), 0 8px 24px -8px rgba(0,0,0,0.45)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
        slideIn: {
          from: { transform: "translateY(-6px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        rise: {
          from: { transform: "translateY(8px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.8s ease-in-out infinite",
        slideIn: "slideIn 0.18s ease-out",
        rise: "rise 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
