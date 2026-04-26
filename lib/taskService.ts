import { getSessionToken } from "./authService";
import { getOnceTaskMap, removeOnceTask } from "./onceTaskStore";
import {
  cacheCompletions,
  cacheTasks,
  enqueue,
  isClientOnline,
  isTempId,
  makeLocalCompletion,
  makeLocalTask,
  OfflineOperation,
  readOfflineState,
  replaceTaskId,
  setQueue,
  writeOfflineState,
} from "./offlineStore";
import { supabase } from "./supabaseClient";
import { Task, TaskCompletion, TaskWithCompletion } from "@/types/task";

function requireSessionToken() {
  const token = getSessionToken();
  if (!token) throw new Error("Please sign in again");
  return token;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
}

function shouldUseOffline(error: unknown) {
  return !isClientOnline() || Boolean(error);
}

async function rpcGetTasks(activeOnly: boolean): Promise<Task[]> {
  const { data, error } = await supabase.rpc(activeOnly ? "app_get_active_tasks" : "app_get_tasks", {
    p_session_token: requireSessionToken(),
  });
  if (error) throw error;
  return data ?? [];
}

function onceDateForTask(task: Task, onceMap: Record<string, string>) {
  return task.once_date ?? onceMap[task.id] ?? null;
}

async function rpcCreateTask(task: Pick<Task, "title" | "description" | "position" | "once_date">): Promise<Task> {
  const { data, error } = await supabase
    .rpc("app_create_task", {
      p_session_token: requireSessionToken(),
      p_title: task.title,
      p_description: task.description,
      p_position: task.position,
      p_once_date: task.once_date,
    })
    .single<Task>();
  if (error) throw error;
  return data;
}

async function rpcUpdateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "created_at">>
): Promise<Task> {
  const { data, error } = await supabase
    .rpc("app_update_task", {
      p_session_token: requireSessionToken(),
      p_task_id: id,
      p_updates: updates,
    })
    .single<Task>();
  if (error) throw error;
  return data;
}

async function syncLocalOnceDates(tasks: Task[]): Promise<Task[]> {
  const onceMap = getOnceTaskMap();
  const updatedTasks = await Promise.all(tasks.map(async (task) => {
    const localOnceDate = onceMap[task.id];
    if (!localOnceDate || task.once_date === localOnceDate) return task;

    try {
      return await rpcUpdateTask(task.id, { once_date: localOnceDate });
    } catch {
      return task;
    }
  }));

  return updatedTasks;
}

async function rpcDeleteTask(id: string): Promise<void> {
  const { error } = await supabase.rpc("app_delete_task", {
    p_session_token: requireSessionToken(),
    p_task_id: id,
  });
  if (error) throw error;
}

async function rpcGetCompletionsForDate(date: string): Promise<TaskCompletion[]> {
  const { data, error } = await supabase.rpc("app_get_completions_for_date", {
    p_session_token: requireSessionToken(),
    p_date: date,
  });
  if (error) throw error;
  return data ?? [];
}

async function rpcGetCompletionsForDates(dates: string[]): Promise<TaskCompletion[]> {
  const { data, error } = await supabase.rpc("app_get_completions_for_dates", {
    p_session_token: requireSessionToken(),
    p_dates: dates,
  });
  if (error) throw error;
  return data ?? [];
}

async function rpcUpsertCompletion(
  taskId: string,
  date: string,
  isCompleted: boolean
): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .rpc("app_upsert_completion", {
      p_session_token: requireSessionToken(),
      p_task_id: taskId,
      p_date: date,
      p_is_completed: isCompleted,
    })
    .single<TaskCompletion>();
  if (error) throw error;
  return data;
}

export async function syncOfflineQueue() {
  if (!isClientOnline() || !getSessionToken()) return;

  let state = readOfflineState();
  let queue = [...state.queue];

  while (queue.length > 0) {
    const op = queue[0];

    try {
      if (op.type === "create_task") {
        const created = await rpcCreateTask(op.data);
        replaceTaskId(op.clientId, created);
      }

      if (op.type === "update_task" && !isTempId(op.taskId)) {
        const updated = await rpcUpdateTask(op.taskId, op.updates);
        state = readOfflineState();
        cacheTasks(state.tasks.map((t) => (t.id === updated.id ? updated : t)));
      }

      if (op.type === "delete_task" && !isTempId(op.taskId)) {
        await rpcDeleteTask(op.taskId);
      }

      if (op.type === "upsert_completion" && !isTempId(op.taskId)) {
        const completion = await rpcUpsertCompletion(op.taskId, op.date, op.isCompleted);
        state = readOfflineState();
        cacheCompletions([
          ...state.completions.filter((c) => `${c.task_id}:${c.completion_date}` !== `${completion.task_id}:${completion.completion_date}`),
          completion,
        ]);
      }

      state = readOfflineState();
      queue = state.queue.filter((item: OfflineOperation) => item.id !== op.id);
      setQueue(queue);
    } catch {
      return;
    }
  }

  try {
    const [tasks, completions] = await Promise.all([
      rpcGetTasks(false),
      rpcGetCompletionsForDates(readOfflineState().completions.map((c) => c.completion_date)),
    ]);
    cacheTasks(tasks);
    cacheCompletions(completions);
  } catch {
    // Freshening the cache is best effort; queued writes already synced.
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    await syncOfflineQueue();
    const tasks = await syncLocalOnceDates(await rpcGetTasks(false));
    cacheTasks(tasks);
    return sortTasks(tasks);
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    return sortTasks(readOfflineState().tasks);
  }
}

export async function getActiveTasks(): Promise<Task[]> {
  try {
    await syncOfflineQueue();
    const tasks = await syncLocalOnceDates(await rpcGetTasks(true));
    const state = readOfflineState();
    const inactive = state.tasks.filter((t) => !t.is_active);
    cacheTasks(sortTasks([...inactive, ...tasks]));
    return sortTasks(tasks);
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    return sortTasks(readOfflineState().tasks.filter((t) => t.is_active));
  }
}

export async function createTask(
  task: Pick<Task, "title" | "description" | "position" | "once_date">
): Promise<Task> {
  try {
    await syncOfflineQueue();
    const created = await rpcCreateTask(task);
    cacheTasks(sortTasks([...readOfflineState().tasks, created]));
    return created;
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    const localTask = makeLocalTask(task);
    const state = readOfflineState();
    writeOfflineState({ ...state, tasks: sortTasks([...state.tasks, localTask]) });
    enqueue({ type: "create_task", clientId: localTask.id, data: task });
    return localTask;
  }
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "created_at">>
): Promise<Task> {
  const state = readOfflineState();
  const existing = state.tasks.find((t) => t.id === id);
  if (!existing) throw new Error("Task not found");

  const optimistic = { ...existing, ...updates, updated_at: new Date().toISOString() };
  writeOfflineState({
    ...state,
    tasks: sortTasks(state.tasks.map((t) => (t.id === id ? optimistic : t))),
  });

  try {
    await syncOfflineQueue();
    if (isTempId(id)) throw new Error("Task is not synced yet");
    const updated = await rpcUpdateTask(id, updates);
    cacheTasks(readOfflineState().tasks.map((t) => (t.id === id ? updated : t)));
    return updated;
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    enqueue({ type: "update_task", taskId: id, updates });
    return optimistic;
  }
}

export async function deleteTask(id: string): Promise<void> {
  removeOnceTask(id);
  const state = readOfflineState();
  writeOfflineState({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    completions: state.completions.filter((c) => c.task_id !== id),
  });

  try {
    await syncOfflineQueue();
    if (isTempId(id)) return;
    await rpcDeleteTask(id);
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    enqueue({ type: "delete_task", taskId: id });
  }
}

export async function getCompletionsForDate(
  date: string
): Promise<TaskCompletion[]> {
  try {
    await syncOfflineQueue();
    const completions = await rpcGetCompletionsForDate(date);
    cacheCompletions(completions);
    return completions;
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    return readOfflineState().completions.filter((c) => c.completion_date === date);
  }
}

export async function upsertCompletion(
  taskId: string,
  date: string,
  isCompleted: boolean
): Promise<TaskCompletion> {
  const state = readOfflineState();
  const existing = state.completions.find((c) => c.task_id === taskId && c.completion_date === date);
  const optimistic = existing
    ? { ...existing, is_completed: isCompleted, updated_at: new Date().toISOString() }
    : makeLocalCompletion(taskId, date, isCompleted);

  writeOfflineState({
    ...state,
    completions: [
      ...state.completions.filter((c) => !(c.task_id === taskId && c.completion_date === date)),
      optimistic,
    ],
  });

  try {
    await syncOfflineQueue();
    if (isTempId(taskId)) throw new Error("Task is not synced yet");
    const completion = await rpcUpsertCompletion(taskId, date, isCompleted);
    cacheCompletions([completion]);
    return completion;
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    enqueue({ type: "upsert_completion", taskId, date, isCompleted });
    return optimistic;
  }
}

export async function getTasksWithCompletions(
  date: string
): Promise<TaskWithCompletion[]> {
  const [activeTasks, completions] = await Promise.all([
    getActiveTasks(),
    getCompletionsForDate(date),
  ]);

  const onceMap = getOnceTaskMap();
  // Recurring tasks appear every day; once tasks appear only on their target date.
  const tasksForDate = activeTasks.filter((task) => {
    const onceDate = onceDateForTask(task, onceMap);
    return onceDate ? onceDate === date : true;
  });

  return tasksForDate.map((task) => {
    const completion = completions.find((c) => c.task_id === task.id);
    return {
      ...task,
      is_completed: completion?.is_completed ?? false,
      completion_id: completion?.id,
    };
  });
}

export async function getCompletionsForDates(
  dates: string[]
): Promise<TaskCompletion[]> {
  if (dates.length === 0) return [];
  try {
    await syncOfflineQueue();
    const completions = await rpcGetCompletionsForDates(dates);
    cacheCompletions(completions);
    return completions;
  } catch (error) {
    if (!shouldUseOffline(error)) throw error;
    return readOfflineState().completions.filter((c) => dates.includes(c.completion_date));
  }
}

export async function getHistorySummaries(
  dates: string[]
): Promise<Map<string, { total: number; completed: number }>> {
  if (dates.length === 0) return new Map();
  const [completions, activeTasks] = await Promise.all([
    getCompletionsForDates(dates),
    getActiveTasks(),
  ]);

  const onceMap = getOnceTaskMap();
  const recurringCount = activeTasks.filter((t) => !onceDateForTask(t, onceMap)).length;
  const onceTasks      = activeTasks.filter((t) => !!onceDateForTask(t, onceMap));

  const summaryMap = new Map<string, { total: number; completed: number }>();
  for (const date of dates) {
    const dateCompletions = completions.filter((c) => c.completion_date === date);
    const completed  = dateCompletions.filter((c) => c.is_completed).length;
    const onceForDate = onceTasks.filter((t) => onceDateForTask(t, onceMap) === date).length;
    summaryMap.set(date, { total: recurringCount + onceForDate, completed });
  }
  return summaryMap;
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
}

export async function calculateStreaks(
  lookbackDays = 365
): Promise<StreakResult> {
  const activeTasks = await getActiveTasks();
  const onceMap = getOnceTaskMap();
  const recurringTasks = activeTasks.filter((t) => !onceDateForTask(t, onceMap));
  if (recurringTasks.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const dates: string[] = [];
  for (let i = 0; i < lookbackDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }

  const completions = await getCompletionsForDates(dates);

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let currentStreakDone = false;

  for (const date of dates) {
    const dateCompletions = completions.filter(
      (c) => c.completion_date === date && c.is_completed
    );
    const isDayComplete = dateCompletions.length >= recurringTasks.length;

    if (isDayComplete) {
      tempStreak++;
      if (!currentStreakDone) currentStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      currentStreakDone = true;
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
}

export async function getCompletionPercentageForDates(
  dates: string[]
): Promise<number> {
  if (dates.length === 0) return 0;
  const [completions, activeTasks] = await Promise.all([
    getCompletionsForDates(dates),
    getActiveTasks(),
  ]);
  const onceMap = getOnceTaskMap();
  const recurringCount = activeTasks.filter((t) => !onceDateForTask(t, onceMap)).length;
  const onceTasks      = activeTasks.filter((t) => !!onceDateForTask(t, onceMap));
  const totalPossible  = recurringCount * dates.length
    + onceTasks.filter((t) => {
      const onceDate = onceDateForTask(t, onceMap);
      return onceDate ? dates.includes(onceDate) : false;
    }).length;
  if (totalPossible === 0) return 0;
  const totalCompleted = completions.filter((c) => c.is_completed).length;
  return Math.round((totalCompleted / totalPossible) * 100);
}
