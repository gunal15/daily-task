"use client";

import { Check } from "lucide-react";
import { TaskWithCompletion } from "@/types/task";
import { C, T } from "@/lib/iosTokens";

interface TaskCardProps {
  task: TaskWithCompletion;
  onToggle?: (id: string, current: boolean) => void;
  readOnly?: boolean;
  isLast?: boolean;
}

/*
 * iOS Reminders-style list row.
 * • 44 pt minimum touch target (Apple HIG requirement)
 * • Circle checkbox: 22 pt — hollow #007AFF border (unchecked) / filled #34C759 + checkmark (checked)
 * • Title: 17 pt body, medium weight when pending, regular + strikethrough when done
 * • Description: 15 pt subheadline, secondary label
 * • Inset separator (left-aligned with text, not the circle)
 */
export default function TaskCard({ task, onToggle, readOnly = false, isLast = false }: TaskCardProps) {
  return (
    <div
      style={{
        display:         "flex",
        alignItems:      "center",
        backgroundColor: C.bg,
        paddingLeft:     "4px",
        minHeight:       "44px",
      }}
    >
      {/* ── Checkbox — 44×44 tap target ──────────────────────────── */}
      <button
        disabled={readOnly}
        onClick={() => !readOnly && onToggle?.(task.id, task.is_completed)}
        aria-label={task.is_completed ? "Mark incomplete" : "Mark complete"}
        style={{
          flexShrink:     0,
          width:          "44px",
          height:         "44px",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     "none",
          border:         "none",
          cursor:         readOnly ? "default" : "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
        className="press"
      >
        {task.is_completed ? (
          /* Checked: green filled circle with white checkmark */
          <span
            style={{
              width:           "22px",
              height:          "22px",
              borderRadius:    "50%",
              backgroundColor: C.green,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
            }}
          >
            <Check style={{ width: "12px", height: "12px", color: "#fff", strokeWidth: 3 }} />
          </span>
        ) : (
          /* Unchecked: hollow circle, iOS blue border */
          <span
            style={{
              width:        "22px",
              height:       "22px",
              borderRadius: "50%",
              border:       `2px solid ${readOnly ? C.label4 : C.blue}`,
              flexShrink:   0,
              display:      "block",
            }}
          />
        )}
      </button>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div
        style={{
          flex:          1,
          paddingTop:    "12px",
          paddingBottom: "12px",
          paddingRight:  "16px",
          minWidth:      0,
          ...(isLast ? {} : { borderBottom: `0.5px solid ${C.sep}` }),
        }}
      >
        <p
          style={{
            ...T.body,
            color:          task.is_completed ? C.label3 : C.label,
            fontWeight:     task.is_completed ? 400 : 500,
            textDecoration: task.is_completed ? "line-through" : "none",
            margin:         0,
          }}
        >
          {task.title}
        </p>
        {task.description && (
          <p
            style={{
              ...T.subhead,
              color:     C.label2,
              margin:    0,
              marginTop: "2px",
            }}
          >
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}
