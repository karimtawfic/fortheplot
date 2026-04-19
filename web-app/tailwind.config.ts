import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // App palette (shorthand aliases used throughout components)
        bg: "#0D0D1A",
        surface: "#1A1A2E",
        "surface-2": "#16213E",
        primary: "#FF6B35",
        accent: "#E94560",
        gold: "#FFD700",
        success: "#4CAF50",
        border: "#2A2A4A",
        // Legacy prefixed names kept for backwards compat
        "app-bg": "#0D0D1A",
        "app-surface": "#1A1A2E",
        "app-surface-2": "#16213E",
        "app-primary": "#FF6B35",
        "app-accent": "#E94560",
        "app-gold": "#FFD700",
        "app-success": "#4CAF50",
        "app-border": "#2A2A4A",
        "app-text": "#FFFFFF",
        "app-text-secondary": "#AAAACC",
        // Category colors
        "cat-social": "#4FC3F7",
        "cat-physical": "#FF8A65",
        "cat-creative": "#CE93D8",
        "cat-food": "#FFF176",
        "cat-outdoor": "#A5D6A7",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #FF6B35, #E94560)",
        "card-gradient": "linear-gradient(180deg, #1A1A2E, #16213E)",
        "dark-scrim": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "pulse-soft": "pulse 2s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        slideUp: "slideUp 0.3s ease-out",
        fadeIn: "fadeIn 0.2s ease-out",
        scaleIn: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 24px rgba(255,107,53,0.4)",
        "glow-gold": "0 0 24px rgba(255,215,0,0.3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
