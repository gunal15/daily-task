"use client";

import { useState, useEffect, useCallback } from "react";
import { getTasksWithCompletions, upsertCompletion } from "@/lib/taskService";
import { getLocalDateString, formatDisplayDate } from "@/lib/dateUtils";
import TaskCard from "@/components/TaskCard";
import ProgressCard from "@/components/ProgressCard";
import Toast from "@/components/Toast";
import { TaskWithCompletion } from "@/types/task";
import { C, R, T, sectionCard, sectionHeader } from "@/lib/iosTokens";

export default function TodayPage() {
  const [tasks,   setTasks]   = useState<TaskWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<{ message: string; type: "success" | "error" } | null>(null);

  const today = getLocalDateString();

  function showToast(msg: string, type: "success" | "error") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  const load = useCallback(async () => {
    try   { setTasks(await getTasksWithCompletions(today)); }
    catch { showToast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id: string, current: boolean) {
    const next = !current;
    setTasks((p) => p.map((t) => t.id === id ? { ...t, is_completed: next } : t));
    try {
      await upsertCompletion(id, today, next);
      showToast(next ? "Completed" : "Marked incomplete", "success");
    } catch {
      setTasks((p) => p.map((t) => t.id === id ? { ...t, is_completed: current } : t));
      showToast("Could not update", "error");
    }
  }

  const completed  = tasks.filter((t) => t.is_completed).length;
  const total      = tasks.length;
  const pending    = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone    = total > 0 && completed === total;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2, paddingBottom: "83px" }}>

      {/* ── Large Title Navigation Bar ───────────────────────────── */}
      <div
        style={{
          position:              "sticky",
          top:                   0,
          zIndex:                10,
          backgroundColor:       C.navBg,
          backdropFilter:        "saturate(180%) blur(20px)",
          WebkitBackdropFilter:  "saturate(180%) blur(20px)",
          padding:               "12px 20px 14px",
          borderBottom:          `0.5px solid ${C.sep}`,
        }}
      >
        <p style={{ ...T.caption2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.blue, margin: 0 }}>
          Today
        </p>
        <h1 style={{ ...T.largeTitle, color: C.label, margin: 0, marginTop: "2px" }}>
          {formatDisplayDate(today)}
        </h1>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "8px" }}>

        {/* Progress widget */}
        {!loading && total > 0 && (
          <ProgressCard total={total} completed={completed} pending={pending} percentage={percentage} />
        )}

        {/* All-done callout */}
        {!loading && allDone && (
          <div
            style={{
              margin:          "0 16px",
              borderRadius:    `${R.lg}px`,
              backgroundColor: "rgba(52,199,89,0.12)",
              padding:         "14px 16px",
              display:         "flex",
              alignItems:      "center",
              gap:             "12px",
            }}
          >
            <span style={{ fontSize: "30px", lineHeight: 1 }}>🎉</span>
            <div>
              <p style={{ ...T.headline, color: C.label, margin: 0 }}>All done for today!</p>
              <p style={{ ...T.subhead,  color: C.green,  margin: 0, marginTop: "2px" }}>Great work keeping up your streak.</p>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="skeleton" style={{ margin: "0 16px", borderRadius: `${R.lg}px`, height: "168px" }} />
            <div style={{ ...sectionCard }}>
              {[80, 65, 55].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 16px", height: "54px", borderBottom: i < 2 ? `0.5px solid ${C.sep}` : undefined }}>
                  <div className="skeleton" style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0 }} />
                  <div className="skeleton" style={{ height: "14px", borderRadius: "7px", width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && total === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>📋</span>
            <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No tasks yet</p>
            <p style={{ ...T.body, color: C.label2, margin: "8px 0 0" }}>Go to the Tasks tab to add your daily tasks.</p>
          </div>
        )}

        {/* ── Inset Grouped task list ───────────────────────────── */}
        {!loading && total > 0 && (
          <div>
            <p style={sectionHeader}>Tasks — {completed} of {total} done</p>
            <div style={sectionCard}>
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  isLast={i === tasks.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
