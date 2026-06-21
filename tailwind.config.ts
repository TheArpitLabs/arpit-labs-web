import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)"
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)"
        },
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        border: {
          DEFAULT: "var(--border)",
          light: "var(--border-light)",
          dark: "var(--border-dark)"
        },
        muted: {
          DEFAULT: "var(--muted)",
          light: "var(--muted-light)",
          dark: "var(--muted-dark)"
        },
        card: {
          DEFAULT: "var(--card)",
          hover: "var(--card-hover)"
        },
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          overlay: "var(--surface-overlay)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
        mono: ["var(--font-mono)"]
      },
      spacing: {
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        32: "var(--space-32)"
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        sm: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.6", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.6", letterSpacing: "-0.02em" }],
        "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "1.3", letterSpacing: "-0.03em" }],
        "4xl": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.03em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        hero: ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.05em", fontWeight: "700" }],
        "section-title": ["clamp(1.75rem, 2.5vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "700" }],
        "card-title": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.7", letterSpacing: "0" }],
        small: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em" }]
      },
      fontWeight: {
        medium: "500",
        semibold: "600",
        bold: "700"
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
        glass: "var(--glass-shadow)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)"
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-subtle': 'var(--gradient-subtle)',
        'gradient-border': 'var(--gradient-border)',
        'gradient-mesh': 'var(--gradient-mesh)'
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
        spring: "500ms"
      },
      transitionTimingFunction: {
        'premium': "cubic-bezier(0.4, 0, 0.2, 1)",
        'spring': "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      },
      backdropBlur: {
        xs: "2px",
        '3xl': "64px"
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      }
    }
  },
  plugins: []
};

export default config;
