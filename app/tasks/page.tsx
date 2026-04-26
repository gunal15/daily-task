"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTasks, updateTask, deleteTask } from "@/lib/taskService";
import { getOnceTaskMap } from "@/lib/onceTaskStore";
import TaskForm from "@/components/TaskForm";
import Toast from "@/components/Toast";
import { Task } from "@/types/task";
import { Plus, ChevronUp, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { C, R, T, sectionCard, sectionHeader, rowSep } from "@/lib/iosTokens";
import { isToday, formatShortDate } from "@/lib/dateUtils";

type Tab = "recurring" | "date-specific";

export default function TasksPage() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<Tab>("recurring");
  const [showForm,      setShowForm]      = useState(false);
  const [editTask,      setEditTask]      = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast,         setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [onceMap,       setOnceMap]       = useState<Record<string, string>>({});

  function showToast(msg: string, type: "success" | "error") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  const load = useCallback(async () => {
    try {
      setTasks(await getTasks());
      setOnceMap(getOnceTaskMap());
    } catch { showToast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = (arr: Task[]) =>
    [...arr].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));

  const recurringTasks  = tasks.filter((t) => !onceMap[t.id]);
  const onceTasks       = tasks
    .filter((t) => !!onceMap[t.id])
    .sort((a, b) => (onceMap[a.id] ?? "").localeCompare(onceMap[b.id] ?? ""));

  const activeRecurring = sorted(recurringTasks.filter((t) => t.is_active));
  const pausedRecurring = sorted(recurringTasks.filter((t) => !t.is_active));

  const nextPos = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) + 1 : 0;

  async function handleSave(data: { title: string; description: string | null; position: number; mode: "recurring" | "once"; onceDate: string }) {
    if (editTask) {
      const u = await updateTask(editTask.id, { title: data.title, description: data.description, position: data.position });
      setTasks((p) => p.map((t) => (t.id === editTask.id ? u : t)));
      showToast("Task updated", "success");
    }
    setShowForm(false);
    setEditTask(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks((p) => p.filter((t) => t.id !== id));
      setOnceMap(getOnceTaskMap());
      setDeleteConfirm(null);
      showToast("Task deleted", "success");
    } catch { showToast("Failed to delete", "error"); }
  }

  async function handleToggleActive(task: Task) {
    try {
      const u = await updateTask(task.id, { is_active: !task.is_active });
      setTasks((p) => p.map((t) => (t.id === task.id ? u : t)));
      showToast(u.is_active ? "Task activated" : "Task paused", "success");
    } catch { showToast("Failed to update", "error"); }
  }

  async function swap(list: Task[], i: number, j: number) {
    const [a, b] = [list[i], list[j]];
    try {
      await Promise.all([updateTask(a.id, { position: b.position }), updateTask(b.id, { position: a.position })]);
      setTasks((p) => p.map((t) => {
        if (t.id === a.id) return { ...t, position: b.position };
        if (t.id === b.id) return { ...t, position: a.position };
        return t;
      }));
    } catch { showToast("Failed to reorder", "error"); }
  }

  function onceDateLabel(date: string): { text: string; color: string } {
    const today = new Date().toISOString().slice(0, 10);
    if (date === today)  return { text: "Today",    color: C.blue   };
    if (date > today)    return { text: formatShortDate(date), color: C.label2  };
    return                      { text: formatShortDate(date), color: C.label3  };
  }

  function RecurringSection({ title, items, reorderable }: { title: string; items: Task[]; reorderable: boolean }) {
    if (!items.length) return null;
    return (
      <div>
        <p style={sectionHeader}>{title}</p>
        <div style={sectionCard}>
          {items.map((task, idx) => (
            <div key={task.id} style={idx < items.length - 1 ? rowSep : {}}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px", minHeight: "54px" }}>
                {reorderable && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginRight: "2px" }}>
                    <button
                      onClick={() => swap(items, idx, idx - 1)}
                      disabled={idx === 0}
                      style={{ display: "flex", padding: "3px", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? C.label4 : C.blue }}
                    >
                      <ChevronUp style={{ width: "16px", height: "16px" }} />
                    </button>
                    <button
                      onClick={() => swap(items, idx, idx + 1)}
                      disabled={idx === items.length - 1}
                      style={{ display: "flex", padding: "3px", cursor: idx === items.length - 1 ? "default" : "pointer", color: idx === items.length - 1 ? C.label4 : C.blue }}
                    >
                      <ChevronDown style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, padding: "10px 0" }}>
                  <p style={{ ...T.body, color: task.is_active ? C.label : C.label3, margin: 0, fontWeight: 500 }}>{task.title}</p>
                  {task.description && (
                    <p style={{ ...T.subhead, color: C.label2, margin: 0, marginTop: "2px" }}>{task.description}</p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                  <button onClick={() => handleToggleActive(task)} style={{ ...T.subhead, color: task.is_active ? C.orange : C.green, cursor: "pointer" }}>
                    {task.is_active ? "Pause" : "Activate"}
                  </button>
                  <button onClick={() => { setEditTask(task); setShowForm(true); }} style={{ ...T.subhead, color: C.blue, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(task.id)} style={{ ...T.subhead, color: C.red, cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2, paddingBottom: "83px" }}>

      {/* ── Navigation Bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: C.navBg,
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `0.5px solid ${C.sep}`,
      }}>
        {/* Title row */}
        <div style={{
          padding: "12px 20px 8px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ ...T.caption2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.blue, margin: 0 }}>
              {user?.username ?? "Manage"}
            </p>
            <h1 style={{ ...T.largeTitle, color: C.label, margin: 0, marginTop: "2px" }}>Tasks</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <button onClick={signOut} className="press" aria-label="Sign out" style={{ display: "flex", color: C.label3, cursor: "pointer", padding: "4px" }}>
              <LogOut style={{ width: "20px", height: "20px" }} />
            </button>
            <button
              onClick={() => router.push("/tasks/add")}
              className="press"
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: C.blue,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "18px", height: "18px", color: "#fff", strokeWidth: 2.5 }} />
            </button>
          </div>
        </div>

        {/* Segmented control */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{
            display: "flex",
            backgroundColor: "rgba(118,118,128,0.12)",
            borderRadius: "9px",
            padding: "2px",
          }}>
            {(["recurring", "date-specific"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "6px 0",
                  borderRadius: "7px",
                  backgroundColor: activeTab === tab ? C.bg : "transparent",
                  boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                  ...T.subhead,
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? C.label : C.label2,
                  cursor: "pointer",
                  transition: "background-color 0.15s, box-shadow 0.15s",
                }}
              >
                {tab === "recurring" ? "Recurring" : "Date Specific"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "8px" }}>

        {/* Skeleton */}
        {loading && (
          <div style={sectionCard}>
            {[70, 55, 80].map((w, i) => (
              <div key={i} style={{ padding: "0 16px", height: "54px", display: "flex", alignItems: "center", borderBottom: i < 2 ? `0.5px solid ${C.sep}` : undefined }}>
                <div className="skeleton" style={{ height: "14px", borderRadius: "7px", width: `${w}%` }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Recurring tab ── */}
        {!loading && activeTab === "recurring" && (
          <>
            {recurringTasks.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", textAlign: "center" }}>
                <span style={{ fontSize: "64px", lineHeight: 1 }}>✏️</span>
                <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No recurring tasks</p>
                <p style={{ ...T.body, color: C.label2, margin: "8px 0 0" }}>Tap + to add your first daily task.</p>
              </div>
            )}
            <RecurringSection title={`Active (${activeRecurring.length})`}  items={activeRecurring} reorderable />
            {pausedRecurring.length > 0 && (
              <RecurringSection title={`Paused (${pausedRecurring.length})`} items={pausedRecurring} reorderable={false} />
            )}
          </>
        )}

        {/* ── Date Specific tab ── */}
        {!loading && activeTab === "date-specific" && (
          <>
            {onceTasks.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", textAlign: "center" }}>
                <span style={{ fontSize: "64px", lineHeight: 1 }}>📅</span>
                <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No date-specific tasks</p>
                <p style={{ ...T.body, color: C.label2, margin: "8px 0 0" }}>
                  Tap + and choose <strong>Once</strong> to add a task for a specific day.
                </p>
              </div>
            ) : (
              <div>
                <p style={sectionHeader}>Scheduled</p>
                <div style={sectionCard}>
                  {onceTasks.map((task, idx) => {
                    const date  = onceMap[task.id] ?? "";
                    const label = onceDateLabel(date);
                    return (
                      <div key={task.id} style={idx < onceTasks.length - 1 ? rowSep : {}}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", minHeight: "54px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ ...T.body, color: C.label, margin: 0, fontWeight: 500 }}>{task.title}</p>
                            {task.description && (
                              <p style={{ ...T.subhead, color: C.label2, margin: 0, marginTop: "2px" }}>{task.description}</p>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                            <span style={{ ...T.subhead, color: label.color, fontWeight: isToday(date) ? 600 : 400 }}>
                              {label.text}
                            </span>
                            <button onClick={() => setDeleteConfirm(task.id)} style={{ ...T.subhead, color: C.red, cursor: "pointer" }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit form (edit only — add goes to /tasks/add) */}
      {showForm && (
        <TaskForm
          task={editTask}
          defaultPosition={nextPos}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTask(null); }}
        />
      )}

      {/* Delete confirmation alert */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 52px", backgroundColor: "rgba(0,0,0,0.45)",
        }}>
          <div style={{
            width: "100%", maxWidth: "270px",
            borderRadius: `${R.lg}px`, overflow: "hidden",
            backgroundColor: "rgba(242,242,247,0.98)",
            backdropFilter: "saturate(180%) blur(40px)",
          }}>
            <div style={{ padding: "20px 16px 16px", textAlign: "center", borderBottom: `0.5px solid ${C.sep}` }}>
              <p style={{ ...T.headline, color: C.label, margin: 0 }}>Delete Task?</p>
              <p style={{ ...T.subhead, color: C.label2, margin: "6px 0 0" }}>
                All completion history will be permanently removed.
              </p>
            </div>
            <div style={{ display: "flex" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "14px", ...T.callout, fontWeight: 600, color: C.blue, cursor: "pointer", borderRight: `0.5px solid ${C.sep}` }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{ flex: 1, padding: "14px", ...T.callout, fontWeight: 600, color: C.red, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
