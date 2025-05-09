export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const TaskStatus = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

// Type variants (optional):
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt?: Date;
  dueDate?: Date;
}

export interface Column {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}

export interface DragItem {
  type: string;
  id: string;
  status: TaskStatus;
}
