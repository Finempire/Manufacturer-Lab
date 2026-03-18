import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Surface system
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        // Border system
        border: {
          DEFAULT: "var(--border-primary)",
          secondary: "var(--border-secondary)",
          accent: "var(--border-accent)",
        },
        // Text system
        foreground: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          muted: "var(--text-muted)",
        },
        // Brand
        brand: {
          DEFAULT: "var(--brand-primary)",
          hover: "var(--brand-hover)",
          muted: "var(--brand-muted)",
        },
      },
      boxShadow: {
        "premium-sm": "var(--shadow-sm)",
        "premium-md": "var(--shadow-md)",
        "premium-lg": "var(--shadow-lg)",
        "premium-xl": "var(--shadow-xl)",
      },
      animation: {
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
