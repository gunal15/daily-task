export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completion_date: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskWithCompletion extends Task {
  is_completed: boolean;
  completion_id?: string;
}

export interface DailySummary {
  date: string;
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}
