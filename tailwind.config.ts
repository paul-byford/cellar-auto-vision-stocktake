import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: "#f5f3ee",
        ink: "#14171c",
        rule: "#d8d3c7",
        oxblood: "#5c1a1f",
        amber: "#9a6b1f",
        moss: "#2f5d3a",
        muted: "#6b6557",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.015em",
        tighter: "-0.03em",
      },
      fontFeatureSettings: {
        tnum: '"tnum"',
      },
    },
  },
  plugins: [],
};
export default config;
