import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1F4E79",
        secondary: "#3A6A9A",
        accent: "#5B8FB9",
        background: "#F3F5F8",
        surface: "#FFFFFF",
        text: "#1F2A37",
        "text-secondary": "#5F6B7A",
      },
      fontFamily: {
        headline: "var(--font-manrope)",
        body: "var(--font-inter)",
        label: "var(--font-space-grotesk)",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "3.5rem" }],
        "6xl": ["3.75rem", { lineHeight: "4.5rem" }],
      },
      spacing: {
        0.5: "0.125rem",
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        6: "1.5rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
        32: "8rem",
      },
      borderRadius: {
        none: "0",
        sm: "0.375rem",
        base: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
      animation: {
        "aurora-drift-a": "auroraDriftA 19s ease-in-out infinite alternate",
        "aurora-drift-b": "auroraDriftB 23s ease-in-out infinite alternate",
        "aurora-drift-c": "auroraDriftC 27s ease-in-out infinite alternate",
      },
      keyframes: {
        auroraDriftA: {
          "0%": {
            transform: "translateX(-4%) translateY(2%) scale(1.04) rotate(-3deg)",
          },
          "100%": {
            transform: "translateX(4%) translateY(-3%) scale(1.12) rotate(4deg)",
          },
        },
        auroraDriftB: {
          "0%": {
            transform: "translateX(5%) translateY(3%) scale(1.08) rotate(2deg)",
          },
          "100%": {
            transform:
              "translateX(-6%) translateY(-4%) scale(1.15) rotate(-4deg)",
          },
        },
        auroraDriftC: {
          "0%": {
            transform: "translateX(-3%) translateY(5%) scale(1.0) rotate(1deg)",
            opacity: "0.26",
          },
          "100%": {
            transform: "translateX(7%) translateY(-5%) scale(1.13) rotate(-3deg)",
            opacity: "0.38",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
