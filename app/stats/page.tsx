"use client";

import { useState, useEffect } from "react";
import {
  calculateStreaks,
  getCompletionPercentageForDates,
} from "@/lib/taskService";
import AppTopLogo from "@/components/AppTopLogo";
import { getCurrentWeekDates, getCurrentMonthDates } from "@/lib/dateUtils";
import { Flame, Trophy, TrendingUp, Calendar } from "lucide-react";

interface Stats {
  weekPct: number;
  monthPct: number;
  currentStreak: number;
  bestStreak: number;
}

/*
 * iOS Stats screen.
 * Layout: 2-column grid of "widget-style" cards.
 * Each card uses:
 *   - White (#FFFFFF) background — sits on #F2F2F7 grouped bg
 *   - 16 pt corner radius
 *   - No border; subtle shadow (1 pt)
 *   - Tinted icon badge (system-colour fill at 12% opacity)
 *   - Large number in the matching system colour
 *   - Caption in secondary label (#8E8E93)
 * A full-width "Streak info" cell closes the section.
 */
export default function StatsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [weekPct, monthPct, streaks] = await Promise.all([
          getCompletionPercentageForDates(getCurrentWeekDates()),
          getCompletionPercentageForDates(getCurrentMonthDates()),
          calculateStreaks(365),
        ]);
        setStats({ weekPct, monthPct, ...streaks });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /*
   * Card descriptors — each maps to an iOS system colour.
   * iconBg = tinted background for the icon badge (colour at ~12% opacity).
   */
  const cards = stats
    ? [
        {
          icon: TrendingUp,
          label: "This Week",
          sub: "completion rate",
          value: `${stats.weekPct}%`,
          color: "#007AFF",
          iconBg: "rgba(0,122,255,0.12)",
        },
        {
          icon: Calendar,
          label: "This Month",
          sub: "completion rate",
          value: `${stats.monthPct}%`,
          color: "#5856D6",
          iconBg: "rgba(88,86,214,0.12)",
        },
        {
          icon: Flame,
          label: "Current Streak",
          sub: stats.currentStreak === 1 ? "day in a row" : "days in a row",
          value: String(stats.currentStreak),
          color: "#FF9500",
          iconBg: "rgba(255,149,0,0.12)",
        },
        {
          icon: Trophy,
          label: "Best Streak",
          sub: stats.bestStreak === 1 ? "day record" : "days record",
          value: String(stats.bestStreak),
          color: "#FFCC00",
          iconBg: "rgba(255,204,0,0.12)",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-ios-grouped-bg pb-[83px]">

      {/* Navigation bar */}
      <div
        className="sticky top-0 z-10 px-4 pt-safe pb-2"
        style={{ backgroundColor: "#F2F2F7" }}
      >
        <div className="pt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-ios-caption1 font-semibold uppercase tracking-widest" style={{ color: "#007AFF" }}>
              Overview
            </p>
            <h1 className="text-ios-largetitle mt-0.5" style={{ color: "#1C1C1E" }}>
              Stats
            </h1>
          </div>
          <AppTopLogo />
        </div>
      </div>

      <div className="pt-2 pb-4 px-4 space-y-4">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-ios-lg animate-pulse"
                style={{ height: "140px", backgroundColor: "#E5E5EA" }}
              />
            ))}
          </div>
        )}

        {/* 2-column card grid */}
        {!loading && stats && (
          <>
            <div>
              <p
                className="text-ios-footnote font-semibold uppercase tracking-wide px-4 pb-1"
                style={{ color: "#6D6D72" }}
              >
                Completion
              </p>
              <div className="grid grid-cols-2 gap-3">
                {cards.slice(0, 2).map(
                  ({ icon: Icon, label, sub, value, color, iconBg }) => (
                    <div
                      key={label}
                      className="rounded-ios-lg p-4"
                      style={{ backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    >
                      {/* Icon badge */}
                      <div
                        className="flex items-center justify-center rounded-ios-sm mb-3"
                        style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
                      >
                        <Icon style={{ width: "18px", height: "18px", color }} />
                      </div>
                      {/* Value */}
                      <p
                        style={{
                          fontSize: "34px",
                          lineHeight: "38px",
                          fontWeight: 700,
                          color,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {value}
                      </p>
                      {/* Label */}
                      <p className="text-ios-subhead font-semibold mt-0.5" style={{ color: "#1C1C1E" }}>
                        {label}
                      </p>
                      <p className="text-ios-caption1 mt-0.5" style={{ color: "#8E8E93" }}>
                        {sub}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <p
                className="text-ios-footnote font-semibold uppercase tracking-wide px-4 pb-1"
                style={{ color: "#6D6D72" }}
              >
                Streaks
              </p>
              <div className="grid grid-cols-2 gap-3">
                {cards.slice(2).map(
                  ({ icon: Icon, label, sub, value, color, iconBg }) => (
                    <div
                      key={label}
                      className="rounded-ios-lg p-4"
                      style={{ backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    >
                      <div
                        className="flex items-center justify-center rounded-ios-sm mb-3"
                        style={{ width: "36px", height: "36px", backgroundColor: iconBg }}
                      >
                        <Icon style={{ width: "18px", height: "18px", color }} />
                      </div>
                      <p
                        style={{
                          fontSize: "34px",
                          lineHeight: "38px",
                          fontWeight: 700,
                          color,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {value}
                      </p>
                      <p className="text-ios-subhead font-semibold mt-0.5" style={{ color: "#1C1C1E" }}>
                        {label}
                      </p>
                      <p className="text-ios-caption1 mt-0.5" style={{ color: "#8E8E93" }}>
                        {sub}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Streak rule callout — iOS-style information row */}
            <div
              className="rounded-ios-lg px-4 py-3"
              style={{ backgroundColor: "rgba(0,122,255,0.08)" }}
            >
              <p className="text-ios-subhead font-semibold" style={{ color: "#007AFF" }}>
                How streaks work
              </p>
              <p className="text-ios-footnote mt-1" style={{ color: "#636366" }}>
                A day counts toward your streak when{" "}
                <span style={{ color: "#1C1C1E", fontWeight: 600 }}>all active tasks</span> are completed. Streaks are calculated from the last 365 days using your current active task list.
              </p>
            </div>
          </>
        )}

        {/* Empty */}
        {!loading && !stats && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span style={{ fontSize: "56px", lineHeight: 1 }}>📊</span>
            <p className="text-ios-title3 mt-4" style={{ color: "#1C1C1E" }}>No stats yet</p>
            <p className="text-ios-body mt-2" style={{ color: "#8E8E93" }}>
              Start completing tasks to see your stats here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
