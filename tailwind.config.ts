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
        brand: {
          primary: "#FF6B00",
          primaryDark: "#E55F00",
          primaryLight: "#FF8A33",
          secondary: "#E63946",
          accent: "#2ECC71",
          surface: "#FFF7F0",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
          soft: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(0, 0, 0, 0.08)",
        cardHover: "0 12px 32px -8px rgba(0, 0, 0, 0.16)",
        nav: "0 2px 16px -4px rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pin-move": {
          "0%": { offsetDistance: "0%" },
          "100%": { offsetDistance: "100%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
