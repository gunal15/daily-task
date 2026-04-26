"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppTopLogo from "@/components/AppTopLogo";
import TaskForm from "@/components/TaskForm";
import { createTask, getTasks } from "@/lib/taskService";
import { setOnceTaskDate } from "@/lib/onceTaskStore";
import { C } from "@/lib/iosTokens";

export default function AddTaskPage() {
  const router = useRouter();
  const [defaultPosition, setDefaultPosition] = useState(0);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => {
    router.push("/tasks");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadNextPosition() {
      try {
        const tasks = await getTasks();
        if (!cancelled) {
          setDefaultPosition(tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) + 1 : 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNextPosition();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(data: { title: string; description: string | null; position: number; mode: "recurring" | "once"; onceDate: string }) {
    const task = await createTask({
      title: data.title,
      description: data.description,
      position: data.position,
      once_date: data.mode === "once" ? data.onceDate : null,
    });
    if (data.mode === "once") {
      setOnceTaskDate(task.id, data.onceDate);
    }
    router.push("/tasks");
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2 }}>
      <div style={{ position: "fixed", top: "14px", right: "20px", zIndex: 210 }}>
        <AppTopLogo width={96} />
      </div>
      {!loading && <TaskForm defaultPosition={defaultPosition} onSave={handleSave} onClose={close} />}
    </div>
  );
}
