import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        success: "var(--success)",
        warning: "var(--warning)",
        border: "var(--border)",
        muted: "var(--muted)",
        card: "var(--card)",
        surface: "var(--surface)"
      },
      fontFamily: {
        sans: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "4rem"
      },
      fontSize: {
        hero: ["clamp(3rem, 4vw, 5rem)", { lineHeight: "1.05", fontWeight: "700" }],
        "section-title": ["clamp(1.75rem, 2.5vw, 2.5rem)", { lineHeight: "1.1", fontWeight: "700" }],
        "card-title": ["1.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        body: ["1rem", { lineHeight: "1.75" }],
        small: ["0.875rem", { lineHeight: "1.5" }]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(37, 99, 235, 0.12)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
