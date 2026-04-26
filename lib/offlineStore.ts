"use client";

import { getStoredUser } from "./authService";
import { Task, TaskCompletion } from "@/types/task";

export type OfflineOperation =
  | {
      id: string;
      type: "create_task";
      clientId: string;
      data: Pick<Task, "title" | "description" | "position" | "once_date">;
    }
  | {
      id: string;
      type: "update_task";
      taskId: string;
      updates: Partial<Omit<Task, "id" | "created_at">>;
    }
  | { id: string; type: "delete_task"; taskId: string }
  | {
      id: string;
      type: "upsert_completion";
      taskId: string;
      date: string;
      isCompleted: boolean;
    };

type NewOfflineOperation =
  | Omit<Extract<OfflineOperation, { type: "create_task" }>, "id">
  | Omit<Extract<OfflineOperation, { type: "update_task" }>, "id">
  | Omit<Extract<OfflineOperation, { type: "delete_task" }>, "id">
  | Omit<Extract<OfflineOperation, { type: "upsert_completion" }>, "id">;

interface OfflineState {
  tasks: Task[];
  completions: TaskCompletion[];
  queue: OfflineOperation[];
}

const EMPTY_STATE: OfflineState = { tasks: [], completions: [], queue: [] };
const EVENT_NAME = "offline-store-changed";

function storageKey() {
  const user = getStoredUser();
  return user ? `daily_tasks_offline_${user.id}` : null;
}

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function isClientOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function isTempId(id: string) {
  return id.startsWith("temp_");
}

export function readOfflineState(): OfflineState {
  if (typeof window === "undefined") return EMPTY_STATE;
  const key = storageKey();
  if (!key) return EMPTY_STATE;

  const raw = localStorage.getItem(key);
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<OfflineState>;
    return {
      tasks: parsed.tasks ?? [],
      completions: parsed.completions ?? [],
      queue: parsed.queue ?? [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function writeOfflineState(state: OfflineState) {
  if (typeof window === "undefined") return;
  const key = storageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onOfflineStoreChange(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

export function cacheTasks(tasks: Task[]) {
  const state = readOfflineState();
  writeOfflineState({ ...state, tasks });
}

export function cacheCompletions(completions: TaskCompletion[]) {
  const state = readOfflineState();
  const incoming = new Map(completions.map((c) => [`${c.task_id}:${c.completion_date}`, c]));
  const kept = state.completions.filter((c) => !incoming.has(`${c.task_id}:${c.completion_date}`));
  writeOfflineState({ ...state, completions: [...kept, ...completions] });
}

export function enqueue(operation: NewOfflineOperation) {
  const state = readOfflineState();
  writeOfflineState({
    ...state,
    queue: [...state.queue, { ...operation, id: makeId("op") } as OfflineOperation],
  });
}

export function setQueue(queue: OfflineOperation[]) {
  const state = readOfflineState();
  writeOfflineState({ ...state, queue });
}

export function replaceTaskId(oldId: string, task: Task) {
  const state = readOfflineState();
  writeOfflineState({
    tasks: state.tasks.map((t) => (t.id === oldId ? task : t)),
    completions: state.completions.map((c) => (
      c.task_id === oldId ? { ...c, task_id: task.id, user_id: task.user_id } : c
    )),
    queue: state.queue.map((op) => {
      if (op.type === "update_task" && op.taskId === oldId) return { ...op, taskId: task.id };
      if (op.type === "delete_task" && op.taskId === oldId) return { ...op, taskId: task.id };
      if (op.type === "upsert_completion" && op.taskId === oldId) return { ...op, taskId: task.id };
      return op;
    }),
  });
}

export function makeLocalTask(data: Pick<Task, "title" | "description" | "position" | "once_date">): Task {
  const user = getStoredUser();
  const timestamp = now();
  return {
    id: makeId("temp_task"),
    user_id: user?.id ?? "",
    title: data.title,
    description: data.description,
    once_date: data.once_date,
    is_active: true,
    position: data.position,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function makeLocalCompletion(
  taskId: string,
  date: string,
  isCompleted: boolean
): TaskCompletion {
  const user = getStoredUser();
  const timestamp = now();
  return {
    id: makeId("temp_completion"),
    user_id: user?.id ?? "",
    task_id: taskId,
    completion_date: date,
    is_completed: isCompleted,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
