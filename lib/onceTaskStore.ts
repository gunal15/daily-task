"use client";

import { getStoredUser } from "./authService";

type OnceTaskMap = Record<string, string>; // taskId → "YYYY-MM-DD"

function storageKey(): string | null {
  const user = getStoredUser();
  return user ? `once_tasks_${user.id}` : null;
}

export function getOnceTaskMap(): OnceTaskMap {
  if (typeof window === "undefined") return {};
  const key = storageKey();
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

export function setOnceTaskDate(taskId: string, date: string): void {
  if (typeof window === "undefined") return;
  const key = storageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify({ ...getOnceTaskMap(), [taskId]: date }));
}

export function removeOnceTask(taskId: string): void {
  if (typeof window === "undefined") return;
  const key = storageKey();
  if (!key) return;
  const map = getOnceTaskMap();
  delete map[taskId];
  localStorage.setItem(key, JSON.stringify(map));
}
