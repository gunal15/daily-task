"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getHistorySummaries } from "@/lib/taskService";
import { getPastDates, formatShortDate, isYesterday } from "@/lib/dateUtils";
import { ChevronRight } from "lucide-react";
import { C, R, T, sectionCard, sectionHeader } from "@/lib/iosTokens";

interface Row { date: string; total: number; completed: number; }

export default function HistoryPage() {
  const [rows,    setRows]    = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const dates = getPastDates(30);
        const map   = await getHistorySummaries(dates);
        setRows(dates.map((date) => ({ date, total: map.get(date)?.total ?? 0, completed: map.get(date)?.completed ?? 0 })));
      } finally { setLoading(false); }
    }
    load();
  }, []);

  function pct(total: number, done: number) { return total > 0 ? Math.round((done / total) * 100) : 0; }

  function barColor(p: number, total: number) {
    if (total === 0) return C.label4;
    if (p === 100)   return C.green;
    if (p >= 60)     return C.orange;
    return C.red;
  }

  function badge(p: number, total: number): { label: string; color: string } {
    if (total === 0) return { label: "—",        color: C.label3 };
    if (p === 100)   return { label: "Complete",  color: C.green  };
    return             { label: `${p}%`,          color: p >= 60 ? C.orange : C.red };
  }

  function dateLabel(d: string) {
    if (isYesterday(d)) return "Yesterday";
    return formatShortDate(d);
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2, paddingBottom: "83px" }}>

      {/* Nav bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: C.navBg,
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        padding: "12px 20px 14px",
        borderBottom: `0.5px solid ${C.sep}`,
      }}>
        <p style={{ ...T.caption2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.blue, margin: 0 }}>Past 30 Days</p>
        <h1 style={{ ...T.largeTitle, color: C.label, margin: 0, marginTop: "2px" }}>History</h1>
      </div>

      <div style={{ paddingTop: "16px", paddingBottom: "8px" }}>
        {/* Skeleton */}
        {loading && (
          <div>
            <div className="skeleton" style={{ margin: "0 32px 6px", height: "12px", width: "60px", borderRadius: "6px" }} />
            <div style={sectionCard}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: i < 5 ? `0.5px solid ${C.sep}` : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div className="skeleton" style={{ height: "14px", width: "100px", borderRadius: "7px" }} />
                    <div className="skeleton" style={{ height: "14px", width: "60px", borderRadius: "7px" }} />
                  </div>
                  <div className="skeleton" style={{ height: "3px", borderRadius: "2px" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && rows.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", textAlign: "center" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>📅</span>
            <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No history yet</p>
            <p style={{ ...T.body, color: C.label2, margin: "8px 0 0" }}>Start completing tasks and history will appear here.</p>
          </div>
        )}

        {/* List */}
        {!loading && rows.length > 0 && (
          <div>
            <p style={sectionHeader}>Recent</p>
            <div style={sectionCard}>
              {rows.map(({ date, total, completed }, idx) => {
                const p = pct(total, completed);
                const b = badge(p, total);
                return (
                  <Link
                    key={date}
                    href={`/history/${date}`}
                    className="press"
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      gap:            "12px",
                      padding:        "12px 16px",
                      textDecoration: "none",
                      borderBottom:   idx < rows.length - 1 ? `0.5px solid ${C.sep}` : undefined,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Date + badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <p style={{ ...T.body, color: C.label, margin: 0, fontWeight: 500 }}>{dateLabel(date)}</p>
                        <span style={{ ...T.subhead, fontWeight: 600, color: b.color }}>{b.label}</span>
                      </div>
                      {/* Progress bar */}
                      {total > 0 ? (
                        <>
                          <div style={{ height: "3px", borderRadius: "2px", backgroundColor: "#E5E5EA", marginBottom: "4px" }}>
                            <div style={{ height: "3px", borderRadius: "2px", backgroundColor: barColor(p, total), width: `${p}%` }} />
                          </div>
                          <p style={{ ...T.caption1, color: C.label2, margin: 0 }}>{completed} of {total} tasks completed</p>
                        </>
                      ) : (
                        <p style={{ ...T.caption1, color: C.label3, margin: 0 }}>No active tasks on this day</p>
                      )}
                    </div>
                    <ChevronRight style={{ width: "16px", height: "16px", color: C.label4, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
