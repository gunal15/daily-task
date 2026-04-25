import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Apple SF Pro via system font stack — renders SF Pro on all Apple devices
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      // iOS system color palette
      colors: {
        ios: {
          blue:       "#007AFF",
          green:      "#34C759",
          red:        "#FF3B30",
          orange:     "#FF9500",
          yellow:     "#FFCC00",
          indigo:     "#5856D6",
          purple:     "#AF52DE",
          teal:       "#5AC8FA",
          // Semantic
          label:      "#1C1C1E",
          "label-2":  "#8E8E93",
          "label-3":  "#AEAEB2",
          "label-4":  "#C7C7CC",
          // Backgrounds
          bg:         "#FFFFFF",
          "bg-2":     "#F2F2F7",
          "bg-3":     "#FFFFFF",
          // Fills
          fill:       "rgba(120,120,128,0.20)",
          "fill-2":   "rgba(120,120,128,0.16)",
          "fill-3":   "rgba(118,118,128,0.12)",
          // Separator
          separator:  "#C6C6C8",
          // Groups
          "grouped-bg":   "#F2F2F7",
          "grouped-bg-2": "#FFFFFF",
          "grouped-bg-3": "#F2F2F7",
        },
      },
      // iOS type scale (pt ≈ px on 1x screens)
      fontSize: {
        "ios-largetitle": ["34px", { lineHeight: "41px", fontWeight: "700" }],
        "ios-title1":     ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "ios-title2":     ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "ios-title3":     ["20px", { lineHeight: "25px", fontWeight: "600" }],
        "ios-headline":   ["17px", { lineHeight: "22px", fontWeight: "600" }],
        "ios-body":       ["17px", { lineHeight: "22px", fontWeight: "400" }],
        "ios-callout":    ["16px", { lineHeight: "21px", fontWeight: "400" }],
        "ios-subhead":    ["15px", { lineHeight: "20px", fontWeight: "400" }],
        "ios-footnote":   ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "ios-caption1":   ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "ios-caption2":   ["11px", { lineHeight: "13px", fontWeight: "400" }],
      },
      borderRadius: {
        "ios-sm":  "8px",
        "ios":     "12px",
        "ios-lg":  "16px",
        "ios-xl":  "20px",
      },
      boxShadow: {
        "ios-card": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
