import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { TaskStatus, TaskPriority } from "../types";
import type { Task, Board } from "../types";

interface KanbanState {
  board: Board;
  createTask: (
    title: string,
    description?: string,
    priority?: TaskPriority,
    dueDate?: Date
  ) => void;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, destinationStatus: TaskStatus) => void;
}

// Generate a task code similar to JIRA ticket (e.g., "TASK-123")
const generateTaskCode = (): string => {
  // Generate a random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `TASK-${randomNum}`;
};

// Initial setup for the board with three columns
const initialBoard: Board = {
  id: uuidv4(),
  title: "Kanban Board",
  columns: [
    {
      id: uuidv4(),
      title: "To Do",
      status: TaskStatus.TODO,
      tasks: [],
    },
    {
      id: uuidv4(),
      title: "In Progress",
      status: TaskStatus.IN_PROGRESS,
      tasks: [],
    },
    {
      id: uuidv4(),
      title: "Done",
      status: TaskStatus.DONE,
      tasks: [],
    },
  ],
};

// Create the store with persistence using localStorage
export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      board: initialBoard,

      createTask: (
        title,
        description,
        priority = TaskPriority.MEDIUM,
        dueDate
      ) => {
        set((state) => {
          const newTask: Task = {
            id: uuidv4(),
            title: `${generateTaskCode()} ${title}`,
            description,
            status: TaskStatus.TODO,
            priority,
            createdAt: new Date(),
            ...(dueDate && { dueDate }),
          };

          // Find the TODO column and add the task to it
          const updatedColumns = state.board.columns.map((column) => {
            if (column.status === TaskStatus.TODO) {
              return {
                ...column,
                tasks: [...column.tasks, newTask],
              };
            }
            return column;
          });

          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      updateTask: (taskId, updatedTask) => {
        set((state) => {
          const updatedColumns = state.board.columns.map((column) => {
            const taskIndex = column.tasks.findIndex(
              (task) => task.id === taskId
            );
            if (taskIndex !== -1) {
              const updatedTasks = [...column.tasks];
              updatedTasks[taskIndex] = {
                ...updatedTasks[taskIndex],
                ...updatedTask,
                updatedAt: new Date(),
              };

              return {
                ...column,
                tasks: updatedTasks,
              };
            }
            return column;
          });

          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      deleteTask: (taskId) => {
        set((state) => {
          const updatedColumns = state.board.columns.map((column) => {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== taskId),
            };
          });

          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      moveTask: (taskId, destinationStatus) => {
        set((state) => {
          // Find the task to move
          let taskToMove: Task | undefined;
          let sourceColumnIndex = -1;

          state.board.columns.forEach((column, index) => {
            const task = column.tasks.find((t) => t.id === taskId);
            if (task) {
              taskToMove = { ...task };
              sourceColumnIndex = index;
            }
          });

          if (!taskToMove || sourceColumnIndex === -1) {
            return state;
          }

          // Remove the task from the source column
          const updatedColumns = [...state.board.columns];
          updatedColumns[sourceColumnIndex] = {
            ...updatedColumns[sourceColumnIndex],
            tasks: updatedColumns[sourceColumnIndex].tasks.filter(
              (task) => task.id !== taskId
            ),
          };

          // Find the destination column and add the task with updated status
          const destinationColumnIndex = updatedColumns.findIndex(
            (col) => col.status === destinationStatus
          );
          if (destinationColumnIndex !== -1) {
            const updatedTask: Task = {
              ...taskToMove,
              status: destinationStatus,
              updatedAt: new Date(),
            };

            updatedColumns[destinationColumnIndex] = {
              ...updatedColumns[destinationColumnIndex],
              tasks: [
                ...updatedColumns[destinationColumnIndex].tasks,
                updatedTask,
              ],
            };
          }

          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },
    }),
    {
      name: "kanban-storage",
      // Optional: define which parts of the state should be stored
      partialize: (state) => ({ board: state.board }),
    }
  )
);
