export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

/**
 * Task status options representing the different columns on the Kanban board
 * This also determines task movement between columns when status is updated
 */
export const TaskStatus = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;

// Type variants using TypeScript's keyof and typeof operators:
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
