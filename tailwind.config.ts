import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontFeatureSettings: {
        'stylistic': '"cv11", "ss01"',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
          emphasis: "hsl(var(--primary-emphasis))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        subtle: {
          DEFAULT: "hsl(var(--subtle))",
          foreground: "hsl(var(--subtle-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        status: {
          draft: "hsl(var(--status-draft))",
          "draft-soft": "hsl(var(--status-draft-soft))",
          pending: "hsl(var(--status-pending))",
          "pending-soft": "hsl(var(--status-pending-soft))",
          review: "hsl(var(--status-review))",
          "review-soft": "hsl(var(--status-review-soft))",
          scheduled: "hsl(var(--status-scheduled))",
          "scheduled-soft": "hsl(var(--status-scheduled-soft))",
          active: "hsl(var(--status-active))",
          "active-soft": "hsl(var(--status-active-soft))",
          complete: "hsl(var(--status-complete))",
          "complete-soft": "hsl(var(--status-complete-soft))",
          cancelled: "hsl(var(--status-cancelled))",
          "cancelled-soft": "hsl(var(--status-cancelled-soft))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          indigo: "hsl(var(--chart-indigo))",
          emerald: "hsl(var(--chart-emerald))",
          teal: "hsl(var(--chart-teal))",
          pink: "hsl(var(--chart-pink))",
          blue: "hsl(var(--chart-blue))",
          amber: "hsl(var(--chart-amber))",
          rose: "hsl(var(--chart-rose))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
        "inner-subtle": "var(--shadow-inner-subtle)",
        card: "var(--shadow-sm)",
        "card-hover": "var(--shadow-md)",
      },
      transitionTimingFunction: {
        quick: "var(--ease-quick)",
        soft: "var(--ease-soft)",
        spring: "var(--ease-spring)",
      },
      transitionDuration: {
        quick: "var(--dur-quick)",
        soft: "var(--dur-soft)",
        spring: "var(--dur-spring)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "em-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "ember-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.45)" },
          "50%":      { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "em-enter":       "em-enter var(--dur-spring) var(--ease-spring) both",
        "fade-in":        "fade-in 0.4s var(--ease-soft)",
        "slide-in-right": "slide-in-right var(--dur-soft) var(--ease-soft)",
        "pulse-subtle":   "pulse-subtle 2s ease-in-out infinite",
        "ember-pulse":    "ember-pulse 2.4s var(--ease-soft) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
