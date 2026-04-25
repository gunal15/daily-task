"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/taskService";
import TaskForm from "@/components/TaskForm";
import Toast from "@/components/Toast";
import { Task } from "@/types/task";
import { Plus, ChevronUp, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { C, R, T, sectionCard, sectionHeader, rowSep } from "@/lib/iosTokens";

export default function TasksPage() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editTask,      setEditTask]      = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast,         setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  const load = useCallback(async () => {
    try   { setTasks(await getTasks()); }
    catch { showToast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = (arr: Task[]) =>
    [...arr].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));

  const active   = sorted(tasks.filter((t) => t.is_active));
  const inactive = sorted(tasks.filter((t) => !t.is_active));

  async function handleSave(data: { title: string; description: string | null; position: number }) {
    if (editTask) {
      const u = await updateTask(editTask.id, data);
      setTasks((p) => p.map((t) => t.id === editTask.id ? u : t));
      showToast("Task updated", "success");
    } else {
      const newTask = await createTask(data);
      setTasks((p) => [...p, newTask]);
      showToast("Task added", "success");
    }
    setShowForm(false);
    setEditTask(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks((p) => p.filter((t) => t.id !== id));
      setDeleteConfirm(null);
      showToast("Task deleted", "success");
    } catch { showToast("Failed to delete", "error"); }
  }

  async function handleToggleActive(task: Task) {
    try {
      const u = await updateTask(task.id, { is_active: !task.is_active });
      setTasks((p) => p.map((t) => t.id === task.id ? u : t));
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

  const nextPos = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) + 1 : 0;

  function Section({ title, items, reorderable }: { title: string; items: Task[]; reorderable: boolean }) {
    if (!items.length) return null;
    return (
      <div>
        <p style={sectionHeader}>{title}</p>
        <div style={sectionCard}>
          {items.map((task, idx) => (
            <div key={task.id} style={idx < items.length - 1 ? rowSep : {}}>
              {/* Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px", minHeight: "54px" }}>
                {/* Reorder buttons */}
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

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0, padding: "10px 0" }}>
                  <p style={{ ...T.body, color: task.is_active ? C.label : C.label3, margin: 0, fontWeight: 500 }}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p style={{ ...T.subhead, color: C.label2, margin: 0, marginTop: "2px" }}>{task.description}</p>
                  )}
                </div>

                {/* Action buttons — iOS text-style controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleActive(task)}
                    style={{ ...T.subhead, color: task.is_active ? C.orange : C.green, cursor: "pointer" }}
                  >
                    {task.is_active ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={() => { setEditTask(task); setShowForm(true); }}
                    style={{ ...T.subhead, color: C.blue, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(task.id)}
                    style={{ ...T.subhead, color: C.red, cursor: "pointer" }}
                  >
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

      {/* Navigation Bar */}
      <div
        style={{
          position:             "sticky",
          top:                  0,
          zIndex:               10,
          backgroundColor:      C.navBg,
          backdropFilter:       "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          padding:              "12px 20px 14px",
          borderBottom:         `0.5px solid ${C.sep}`,
          display:              "flex",
          alignItems:           "flex-end",
          justifyContent:       "space-between",
        }}
      >
        <div>
          <p style={{ ...T.caption2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.blue, margin: 0 }}>
            {user?.username ?? "Manage"}
          </p>
          <h1 style={{ ...T.largeTitle, color: C.label, margin: 0, marginTop: "2px" }}>Tasks</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <button
            onClick={signOut}
            className="press"
            aria-label="Sign out"
            style={{ display: "flex", color: C.label3, cursor: "pointer", padding: "4px" }}
          >
            <LogOut style={{ width: "20px", height: "20px" }} />
          </button>
          {/* iOS nav bar trailing button */}
          <button
            onClick={() => router.push("/tasks/add")}
            className="press"
            style={{
              width:           "32px",
              height:          "32px",
              borderRadius:    "50%",
              backgroundColor: C.blue,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              cursor:          "pointer",
            }}
          >
            <Plus style={{ width: "18px", height: "18px", color: "#fff", strokeWidth: 2.5 }} />
          </button>
        </div>
      </div>

      {/* Content */}
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

        {!loading && tasks.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px", textAlign: "center" }}>
            <span style={{ fontSize: "64px", lineHeight: 1 }}>✏️</span>
            <p style={{ ...T.title2, color: C.label, margin: "16px 0 0" }}>No tasks yet</p>
            <p style={{ ...T.body,   color: C.label2, margin: "8px 0 0" }}>Tap + to add your first daily task.</p>
          </div>
        )}

        {!loading && <Section title={`Active (${active.length})`}  items={active}   reorderable />}
        {!loading && inactive.length > 0 && (
          <Section title={`Paused (${inactive.length})`} items={inactive} reorderable={false} />
        )}
      </div>

      {showForm && (
        <TaskForm
          task={editTask}
          defaultPosition={nextPos}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTask(null); }}
        />
      )}

      {/* iOS Alert — delete confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position:        "fixed",
            inset:           0,
            zIndex:          200,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            padding:         "0 52px",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width:           "100%",
              maxWidth:        "270px",
              borderRadius:    `${R.lg}px`,
              overflow:        "hidden",
              backgroundColor: "rgba(242,242,247,0.98)",
              backdropFilter:  "saturate(180%) blur(40px)",
            }}
          >
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
