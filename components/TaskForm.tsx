"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task } from "@/types/task";
import { C, R, T } from "@/lib/iosTokens";
import { getLocalDateString } from "@/lib/dateUtils";

type Mode = "recurring" | "once";

interface Props {
  task?: Task | null;
  defaultPosition?: number;
  onSave: (data: { title: string; description: string | null; position: number; mode: Mode; onceDate: string }) => Promise<void>;
  onClose: () => void;
}

/*
 * iOS bottom sheet ("sheet" modal presentation).
 * HIG spec:
 * • Drag handle: 36 × 5 pt pill, #C7C7CC, centred 8 pt from top edge
 * • Sheet background: #F2F2F7 (grouped background — NOT white)
 * • Input cells: white cards on the gray sheet background
 * • Navigation row: Cancel (left, blue) | Title (centre, headline) | Done (right, blue bold)
 * • CTA button: 50 pt tall, fully rounded pill, #007AFF filled
 */
export default function TaskForm({ task, defaultPosition = 0, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState(task?.title       ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [position,    setPosition]    = useState(task?.position    ?? defaultPosition);
  const [mode,        setMode]        = useState<Mode>("recurring");
  const [onceDate,    setOnceDate]    = useState(getLocalDateString());
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), description: description.trim() || null, position, mode, onceDate });
    } catch {
      setError("Could not save — please try again.");
      setSaving(false);
    }
  }

  return (
    /* Scrim */
    <div
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          200,
        display:         "flex",
        flexDirection:   "column",
        justifyContent:  "flex-end",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    >
      {/* Tap outside to dismiss */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} aria-hidden />

      {/* Sheet */}
      <div
        style={{
          position:        "relative",
          backgroundColor: C.bg2,
          borderRadius:    `${R.xl}px ${R.xl}px 0 0`,
          maxWidth:        "480px",
          width:           "100%",
          margin:          "0 auto",
          paddingBottom:   "env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "10px", paddingBottom: "4px" }}>
          <div style={{ width: "36px", height: "5px", borderRadius: "3px", backgroundColor: C.label4 }} />
        </div>

        {/* Navigation row */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            padding:        "8px 16px 12px",
            borderBottom:   `0.5px solid ${C.sep}`,
          }}
        >
          <button onClick={onClose} style={{ ...T.callout, color: C.blue, minWidth: "64px", background: "none", cursor: "pointer" }}>
            Cancel
          </button>
          <p style={{ ...T.headline, color: C.label, flex: 1, textAlign: "center", margin: 0 }}>
            {task ? "Edit Task" : "New Task"}
          </p>
          <button
            form="task-form"
            type="submit"
            disabled={saving}
            style={{
              ...T.callout,
              fontWeight: 600,
              color:      saving ? C.label4 : C.blue,
              minWidth:   "64px",
              textAlign:  "right",
              background: "none",
              cursor:     saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : task ? "Save" : "Add"}
          </button>
        </div>

        {/* Form */}
        <form id="task-form" onSubmit={submit} style={{ padding: "20px 16px 8px" }}>
          {/* Title cell */}
          <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg, marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px", minHeight: "44px" }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                autoFocus
                style={{
                  ...T.body,
                  flex:             1,
                  color:            C.label,
                  backgroundColor:  "transparent",
                  border:           "none",
                  outline:          "none",
                  padding:          "11px 0",
                }}
              />
              {title && (
                <button
                  type="button"
                  onClick={() => setTitle("")}
                  style={{ background: "none", cursor: "pointer", marginLeft: "8px", flexShrink: 0, display: "flex" }}
                >
                  <X style={{ width: "18px", height: "18px", color: C.label3 }} />
                </button>
              )}
            </div>
          </div>

          {/* Notes cell */}
          <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg, marginBottom: "10px" }}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes (optional)"
              rows={3}
              style={{
                ...T.body,
                display:         "block",
                width:           "100%",
                padding:         "12px 16px",
                color:           C.label,
                backgroundColor: "transparent",
                border:          "none",
                outline:         "none",
                resize:          "none",
              }}
            />
          </div>

          {/* Recurrence — only when creating a new task */}
          {!task && (
            <>
              <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg, marginBottom: "10px" }}>
                {(["recurring", "once"] as const).map((m, i) => (
                  <div key={m}>
                    {i > 0 && <div style={{ height: "0.5px", backgroundColor: C.sep, marginLeft: "16px" }} />}
                    <div
                      onClick={() => setMode(m)}
                      style={{ display: "flex", alignItems: "center", padding: "0 16px", minHeight: "50px", cursor: "pointer" }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ ...T.body, color: C.label, margin: 0 }}>
                          {m === "recurring" ? "Recurring" : "Once"}
                        </p>
                        <p style={{ ...T.caption1, color: C.label2, margin: "1px 0 0" }}>
                          {m === "recurring" ? "Appears every day" : "Only for a specific day"}
                        </p>
                      </div>
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${mode === m ? C.blue : C.sep}`,
                        backgroundColor: mode === m ? C.blue : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {mode === m && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fff" }} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Date picker — visible only when "once" is selected */}
              {mode === "once" && (
                <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg, marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "0 16px", minHeight: "44px" }}>
                    <p style={{ ...T.body, color: C.label, flex: 1, margin: 0 }}>Date</p>
                    <input
                      type="date"
                      value={onceDate}
                      onChange={(e) => setOnceDate(e.target.value)}
                      style={{
                        ...T.body, color: C.blue,
                        backgroundColor: "transparent", border: "none", outline: "none", cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Position cell */}
          <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg, marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 16px", minHeight: "44px" }}>
              <p style={{ ...T.body, color: C.label, flex: 1, margin: 0 }}>Position</p>
              <input
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                min={0}
                style={{
                  ...T.body,
                  color:           C.blue,
                  backgroundColor: "transparent",
                  border:          "none",
                  outline:         "none",
                  textAlign:       "right",
                  width:           "64px",
                }}
              />
            </div>
            <p style={{ ...T.caption1, color: C.label2, padding: "0 16px 10px", margin: 0 }}>
              Lower number appears first.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...T.footnote, color: C.red, margin: "0 0 12px" }}>{error}</p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={saving}
            style={{
              display:         "block",
              width:           "100%",
              height:          "50px",
              borderRadius:    "25px",
              backgroundColor: saving ? C.label4 : C.blue,
              color:           "#fff",
              ...T.headline,
              cursor:          saving ? "default" : "pointer",
              marginTop:       "8px",
            }}
            className="press"
          >
            {saving ? "Saving…" : task ? "Save Changes" : "Add Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
