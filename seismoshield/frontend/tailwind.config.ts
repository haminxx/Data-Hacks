import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A56DB",
          bright: "#3b82f6",
          dim: "#1647b3",
          glow: "rgba(26, 86, 219, 0.35)",
        },
        surface: {
          DEFAULT: "#0F172A",
          raised: "#0b1224",
          overlay: "#0a1020",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(26, 86, 219, 0.15)",
        card: "0 4px 24px rgba(0, 0, 0, 0.35)",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
