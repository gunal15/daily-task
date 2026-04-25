"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, CheckSquare, Clock, TrendingUp } from "lucide-react";

const TABS = [
  { href: "/today",   label: "Today",   Icon: Sun },
  { href: "/tasks",   label: "Tasks",   Icon: CheckSquare },
  { href: "/history", label: "History", Icon: Clock },
  { href: "/stats",   label: "Stats",   Icon: TrendingUp },
];

const BLUE   = "#007AFF";
const GRAY   = "#8E8E93";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    /*
     * iOS Tab Bar — exact HIG spec:
     * • 49 pt content height + safe-area-inset-bottom
     * • Translucent background: rgba(249,249,249,0.94) + saturate(180%) blur(20px)
     * • 0.5 px top hairline border
     * • Each tab: icon (25 pt) stacked above label (10 pt Caption 2)
     * • Active tint: #007AFF  •  Inactive: #8E8E93
     * All CSS is inline — no Tailwind dependency for visual properties.
     */
    <nav
      style={{
        position:              "fixed",
        bottom:                0,
        left:                  0,
        right:                 0,
        zIndex:                100,
        backgroundColor:       "rgba(249,249,249,0.94)",
        backdropFilter:        "saturate(180%) blur(20px)",
        WebkitBackdropFilter:  "saturate(180%) blur(20px)",
        borderTop:             "0.5px solid rgba(0,0,0,0.15)",
      }}
    >
      {/* Centre-constrain to match the app container */}
      <div
        style={{
          maxWidth:      "480px",
          margin:        "0 auto",
          display:       "flex",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const color  = active ? BLUE : GRAY;
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex:           1,
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                paddingTop:     "8px",
                paddingBottom:  "4px",
                gap:            "3px",
                color,
                textDecoration: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon
                style={{
                  width:       "25px",
                  height:      "25px",
                  strokeWidth: active ? 2.2 : 1.8,
                  color,
                }}
              />
              <span
                style={{
                  fontSize:   "10px",
                  lineHeight: "13px",
                  fontWeight: active ? 600 : 400,
                  color,
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
