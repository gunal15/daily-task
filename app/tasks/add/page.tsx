"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import { createTask, getTasks } from "@/lib/taskService";
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

  async function handleSave(data: { title: string; description: string | null; position: number }) {
    await createTask(data);
    router.push("/tasks");
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2 }}>
      {!loading && <TaskForm defaultPosition={defaultPosition} onSave={handleSave} onClose={close} />}
    </div>
  );
}
