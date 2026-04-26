"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppTopLogo from "@/components/AppTopLogo";
import { getTasksWithCompletions } from "@/lib/taskService";
import { formatDisplayDate, isToday } from "@/lib/dateUtils";
import TaskCard from "@/components/TaskCard";
import ProgressCard from "@/components/ProgressCard";
import { TaskWithCompletion } from "@/types/task";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalDateString } from "@/lib/dateUtils";
import { C, R, T, sectionCard, sectionHeader } from "@/lib/iosTokens";

export default function HistoryDatePage() {
  const { date } = useParams() as { date: string };
  const router   = useRouter();

  const [tasks,   setTasks]   = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getLocalDateString();

  function shiftDate(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return getLocalDateString(dt);
  }

  function navigate(days: number) {
    router.push(`/history/${shiftDate(date, days)}`);
  }

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setTasks([]);
    getTasksWithCompletions(date)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [date]);

  const completed  = tasks.filter((t) => t.is_completed).length;
  const total      = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2, paddingBottom: "83px" }}>

      {/* ── Compact Nav Bar with Back Button ─────────────────────── */}
      <div style={{
        position:             "sticky",
        top:                  0,
        zIndex:               10,
        backgroundColor:      C.navBg,
        backdropFilter:       "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom:         `0.5px solid ${C.sep}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 0" }}>
          <AppTopLogo width={88} />

          {/* Day navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: "rgba(0,122,255,0.10)",
                cursor: "pointer",
                color: C.blue,
              }}
            >
              <ChevronLeft style={{ width: "18px", height: "18px" }} />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={date >= today}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: date >= today ? "transparent" : "rgba(0,122,255,0.10)",
                cursor: date >= today ? "default" : "pointer",
                color: date >= today ? C.label4 : C.blue,
              }}
            >
              <ChevronRight style={{ width: "18px", height: "18px" }} />
            </button>
          </div>
        </div>

        {/* Back row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 2px" }}>
          <button
            onClick={() => router.back()}
            className="press"
            style={{ display: "flex", alignItems: "center", gap: "2px", color: C.blue, cursor: "pointer" }}
          >
            <ChevronLeft style={{ width: "22px", height: "22px" }} />
            <span style={{ ...T.callout, color: C.blue }}>History</span>
          </button>
        </div>

        {/* Title */}
        <div style={{ padding: "4px 20px 14px" }}>
          <h1 style={{ ...T.title2, color: C.label, margin: 0 }}>
            {date ? formatDisplayDate(date) : ""}
          </h1>
          {isToday(date) && (
            <span style={{
              display:         "inline-block",
              marginTop:       "4px",
              padding:         "2px 10px",
              borderRadius:    "99px",
              backgroundColor: "rgba(0,122,255,0.12)",
              ...T.caption1,
              fontWeight:      600,
              color:           C.blue,
            }}>
              Today
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "8px" }}>
        {/* Skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="skeleton" style={{ margin: "0 16px", borderRadius: `${R.lg}px`, height: "168px" }} />
            <div style={sectionCard}>
              {[80, 60, 70].map((w, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", padding: "0 16px", height: "54px", alignItems: "center", borderBottom: i < 2 ? `0.5px solid ${C.sep}` : undefined }}>
                  <div className="skeleton" style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0 }} />
                  <div className="skeleton" style={{ height: "14px", borderRadius: "7px", width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress card */}
        {!loading && total > 0 && (
          <ProgressCard total={total} completed={completed} pending={total - completed} percentage={percentage} />
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", textAlign: "center" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>📅</span>
            <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No tasks</p>
            <p style={{ ...T.body, color: C.label2, margin: "8px 0 0" }}>No active tasks found for this date.</p>
          </div>
        )}

        {/* Task list — read-only */}
        {!loading && total > 0 && (
          <div>
            <p style={sectionHeader}>Tasks</p>
            <div style={sectionCard}>
              {tasks.map((task, i) => (
                <TaskCard key={task.id} task={task} readOnly isLast={i === tasks.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
