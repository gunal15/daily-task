"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppTopLogo from "@/components/AppTopLogo";
import { getHistorySummaries } from "@/lib/taskService";
import {
  getWeekDates,
  isToday,
  isYesterday,
  getLocalDateString,
  formatShortDate,
} from "@/lib/dateUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, R, T, sectionCard } from "@/lib/iosTokens";

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Row {
  date: string;
  total: number;
  completed: number;
}

export default function HistoryPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getLocalDateString();
  const weekDates = getWeekDates(weekOffset);

  function weekLabel(): string {
    const first = new Date(weekDates[0] + "T00:00:00");
    const last = new Date(weekDates[6] + "T00:00:00");
    if (first.getMonth() === last.getMonth()) {
      return first.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return `${first.toLocaleDateString("en-US", { month: "short" })} – ${last.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const dates = getWeekDates(weekOffset);
        const map = await getHistorySummaries(dates);
        if (!cancelled) {
          setRows(
            dates.map((date) => ({
              date,
              total: map.get(date)?.total ?? 0,
              completed: map.get(date)?.completed ?? 0,
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [weekOffset]);

  function pct(total: number, done: number) {
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function barColor(p: number) {
    if (p === 100) return C.green;
    if (p >= 60) return C.orange;
    return C.red;
  }

  function badge(
    p: number,
    total: number,
    future: boolean,
  ): { label: string; color: string } {
    if (future) return { label: "—", color: C.label4 };
    if (total === 0) return { label: "—", color: C.label3 };
    if (p === 100) return { label: "Complete", color: C.green };
    return { label: `${p}%`, color: p >= 60 ? C.orange : C.red };
  }

  function dateLabel(d: string): string {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return formatShortDate(d);
  }

  const navBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: C.bg2,
        paddingBottom: "83px",
      }}
    >
      {/* ── Sticky header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: C.navBg,
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: `0.5px solid ${C.sep}`,
        }}
      >
        {/* Title */}
        <div style={{ padding: "10px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                ...T.caption2,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: C.blue,
                margin: 0,
              }}
            >
              Weekly View
            </p>
            <h1
              style={{
                ...T.largeTitle,
                color: C.label,
                margin: 0,
                marginTop: "2px",
              }}
            >
              History
            </h1>
          </div>
          <AppTopLogo />
        </div>

        {/* Navigation: Today | < Month Year > */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 16px 10px",
            gap: "8px",
          }}
        >
          {/* Today */}
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              ...T.subhead,
              fontWeight: 600,
              color: weekOffset === 0 ? C.label3 : C.blue,
              background: "none",
              border: `1px solid ${weekOffset === 0 ? C.label4 : C.blue}`,
              borderRadius: "14px",
              padding: "3px 12px",
              cursor: weekOffset === 0 ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            Today
          </button>

          {/* < Month Year > */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              justifyContent: "flex-end",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              style={{ ...navBtn, color: C.label }}
            >
              <ChevronLeft size={20} />
            </button>
            <span
              style={{
                ...T.headline,
                color: C.label,
                minWidth: "150px",
                textAlign: "center",
              }}
            >
              {weekLabel()}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={weekOffset >= 0}
              style={{
                ...navBtn,
                color: weekOffset >= 0 ? C.label4 : C.label,
                cursor: weekOffset >= 0 ? "default" : "pointer",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* 7-day column headers */}
        {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 4px 12px" }}>
          {weekDates.map((date, i) => {
            const dayNum  = parseInt(date.split("-")[2]);
            const isNow   = isToday(date);
            const future  = date > today;
            return (
              <div key={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span style={{
                  ...T.caption2,
                  color:      isNow ? C.blue : future ? C.label4 : C.label2,
                  fontWeight: isNow ? 700 : 400,
                }}>
                  {DAY_ABBR[i]}
                </span>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  backgroundColor: isNow ? C.blue : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    ...T.subhead,
                    fontWeight: isNow ? 700 : 400,
                    color: isNow ? "#FFF" : future ? C.label4 : C.label,
                  }}>
                    {dayNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div> */}
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop: "16px", paddingBottom: "8px" }}>
        {/* Skeleton */}
        {loading && (
          <div style={sectionCard}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  borderBottom: i < 7 ? `0.5px solid ${C.sep}` : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{
                      height: "14px",
                      width: "110px",
                      borderRadius: "7px",
                    }}
                  />
                  <div
                    className="skeleton"
                    style={{
                      height: "14px",
                      width: "60px",
                      borderRadius: "7px",
                    }}
                  />
                </div>
                <div
                  className="skeleton"
                  style={{ height: "3px", borderRadius: "2px" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Week rows */}
        {!loading && (
          <div style={sectionCard}>
            {rows.map(({ date, total, completed }, idx) => {
              const future = date > today;
              const p = pct(total, completed);
              const b = badge(p, total, future);
              return (
                <Link
                  key={date}
                  href={future || total === 0 ? "#" : `/history/${date}`}
                  className={!future && total > 0 ? "press" : ""}
                  onClick={
                    future || total === 0
                      ? (e) => e.preventDefault()
                      : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    textDecoration: "none",
                    borderBottom:
                      idx < rows.length - 1
                        ? `0.5px solid ${C.sep}`
                        : undefined,
                    opacity: future ? 0.4 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <p
                        style={{
                          ...T.body,
                          color: C.label,
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {dateLabel(date)}
                      </p>
                      <span
                        style={{
                          ...T.subhead,
                          fontWeight: 600,
                          color: b.color,
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                    {total > 0 ? (
                      <>
                        <div
                          style={{
                            height: "3px",
                            borderRadius: "2px",
                            backgroundColor: "#E5E5EA",
                            marginBottom: "4px",
                          }}
                        >
                          <div
                            style={{
                              height: "3px",
                              borderRadius: "2px",
                              backgroundColor: barColor(p),
                              width: `${p}%`,
                            }}
                          />
                        </div>
                        <p
                          style={{ ...T.caption1, color: C.label2, margin: 0 }}
                        >
                          {completed} of {total} tasks completed
                        </p>
                      </>
                    ) : (
                      <p style={{ ...T.caption1, color: C.label3, margin: 0 }}>
                        {future ? "Upcoming" : "No active tasks on this day"}
                      </p>
                    )}
                  </div>
                  {!future && total > 0 && (
                    <ChevronRight
                      style={{
                        width: "16px",
                        height: "16px",
                        color: C.label4,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
