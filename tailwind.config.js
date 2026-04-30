/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:      "#080c10",
        panel:   "#0d1117",
        border:  "#1e2a38",
        neon:    "#00f5c4",
        neon2:   "#0ea5e9",
        muted:   "#64748b",
        danger:  "#ef4444",
        warn:    "#f59e0b",
        success: "#22c55e",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
