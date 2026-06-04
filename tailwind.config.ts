import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Slate & Sky base ── */
        slate: {
          surface:  "#F4F6F9",
          subtle:   "#EDF1F7",
          border:   "#DCE5F0",
          muted:    "#B8CDE0",
          "3":      "#6B8099",
          "2":      "#3A5A72",
          "1":      "#1E2B3C",
          dark:     "#111822",
        },
        /* ── Brand blue ── */
        brand: {
          50:  "#EBF3FC",
          100: "#D6E4F0",
          200: "#A8CCE8",
          500: "#3A7BD5",
          600: "#2E65B5",
          700: "#2560B0",
          900: "#0F2847",
        },
        /* ── Semantic transaction colors ── */
        income: {
          DEFAULT: "#2EB87E",
          light:   "#1A9E68",
          bg:      "#E8F7F0",
          border:  "#B6E8D4",
        },
        expense: {
          DEFAULT: "#E05A6A",
          light:   "#C0394A",
          bg:      "#FEF0F0",
          border:  "#F5C0C7",
        },
        loan: {
          DEFAULT: "#7C5CBF",
          light:   "#6347A8",
          bg:      "#EEF0FB",
          border:  "#CEC9EF",
        },
        borrow: {
          DEFAULT: "#F59C3A",
          light:   "#D97F1A",
          bg:      "#FFF5E8",
          border:  "#FDDDB0",
        },
        split: {
          DEFAULT: "#3A7BD5",
          bg:      "#EDF2FA",
          border:  "#C0D4F0",
        },
        recurring: {
          DEFAULT: "#5A8FAA",
          bg:      "#F0F4F9",
          border:  "#C0D8E8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        sm:  "6px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
      },
      fontSize: {
        xs:   ["11px", { lineHeight: "16px" }],
        sm:   ["12px", { lineHeight: "18px" }],
        base: ["13px", { lineHeight: "20px" }],
        md:   ["14px", { lineHeight: "22px" }],
        lg:   ["16px", { lineHeight: "24px" }],
        xl:   ["18px", { lineHeight: "28px" }],
        "2xl": ["22px", { lineHeight: "32px" }],
      },
      boxShadow: {
        card:  "0 1px 4px 0 rgba(30,43,60,0.06)",
        focus: "0 0 0 3px rgba(58,123,213,0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
