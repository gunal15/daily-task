// iOS Human Interface Guidelines — design tokens
// Use these in inline `style={{}}` props so rendering is guaranteed
// regardless of Tailwind CSS class generation.

export const C = {
  // System colours
  blue:    "#007AFF",
  green:   "#34C759",
  red:     "#FF3B30",
  orange:  "#FF9500",
  yellow:  "#FFCC00",
  indigo:  "#5856D6",
  purple:  "#AF52DE",
  // Semantic label colours
  label:   "#1C1C1E",
  label2:  "#8E8E93",
  label3:  "#AEAEB2",
  label4:  "#C7C7CC",
  // Background colours
  bg:      "#FFFFFF",
  bg2:     "#F2F2F7",
  // Separator
  sep:     "#C6C6C8",
  sepRgba: "rgba(60,60,67,0.29)",
  // Tab / nav bar (frosted glass)
  tabBg:   "rgba(249,249,249,0.94)",
  navBg:   "rgba(242,242,247,0.92)",
} as const;

// Border radii (px values as numbers)
export const R = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

// iOS type scale — spread into style={{}} as: style={{ ...T.headline, color: C.label }}
export const T = {
  largeTitle: { fontSize: "34px", lineHeight: "41px", fontWeight: 700, letterSpacing: "-0.5px" },
  title1:     { fontSize: "28px", lineHeight: "34px", fontWeight: 700 },
  title2:     { fontSize: "22px", lineHeight: "28px", fontWeight: 700 },
  title3:     { fontSize: "20px", lineHeight: "25px", fontWeight: 600 },
  headline:   { fontSize: "17px", lineHeight: "22px", fontWeight: 600 },
  body:       { fontSize: "17px", lineHeight: "22px", fontWeight: 400 },
  callout:    { fontSize: "16px", lineHeight: "21px", fontWeight: 400 },
  subhead:    { fontSize: "15px", lineHeight: "20px", fontWeight: 400 },
  footnote:   { fontSize: "13px", lineHeight: "18px", fontWeight: 400 },
  caption1:   { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
  caption2:   { fontSize: "11px", lineHeight: "13px", fontWeight: 400 },
} as const;

// Reusable section-card container (inset grouped list)
export const sectionCard: React.CSSProperties = {
  margin: "0 16px",
  borderRadius: `${R.lg}px`,
  overflow: "hidden",
  backgroundColor: C.bg,
};

// Section header text above a card
export const sectionHeader: React.CSSProperties = {
  ...T.footnote,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: C.label2,
  paddingLeft: "32px",
  paddingRight: "32px",
  paddingBottom: "6px",
};

// Inset row separator (left-inset, iOS style)
export const rowSep: React.CSSProperties = {
  borderBottom: `0.5px solid ${C.sep}`,
};
