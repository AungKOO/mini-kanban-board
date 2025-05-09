/**
 * Kanban Board State Management
 *
 * This module defines the Zustand store for managing the Kanban board state.
 * It handles task creation, updates, deletion, and movement between columns,
 * as well as persistence to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { TaskStatus, TaskPriority } from "../types";
import type { Task, Board } from "../types";

/**
 * Interface defining the Kanban state and actions
 */
interface KanbanState {
  /** The main board containing columns and tasks */
  board: Board;

  /**
   * Creates a new task in the "To Do" column
   * @param title - The title of the task
   * @param description - Optional description of the task
   * @param priority - Task priority level (defaults to MEDIUM)
   * @param dueDate - Optional due date for the task
   */
  createTask: (
    title: string,
    description?: string,
    priority?: TaskPriority,
    dueDate?: Date
  ) => void;

  /**
   * Updates an existing task
   * @param taskId - ID of the task to update
   * @param updatedTask - Partial task object with fields to update
   */
  updateTask: (taskId: string, updatedTask: Partial<Task>) => void;

  /**
   * Deletes a task
   * @param taskId - ID of the task to delete
   */
  deleteTask: (taskId: string) => void;

  /**
   * Moves a task to a different column
   * @param taskId - ID of the task to move
   * @param destinationStatus - Status representing the destination column
   */
  moveTask: (taskId: string, destinationStatus: TaskStatus) => void;
}

/**
 * Generates a JIRA-like task code (e.g., "TASK-123")
 * @returns A unique task code string
 */
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

      /**
       * Creates a new task and adds it to the "To Do" column
       */
      createTask: (
        title,
        description,
        priority = TaskPriority.MEDIUM,
        dueDate
      ) => {
        set((state) => {
          // Create a new task with unique ID and generated code
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

          // Return updated state
          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      /**
       * Updates an existing task's properties
       */
      updateTask: (taskId, updatedTask) => {
        set((state) => {
          // Look through all columns to find and update the task
          const updatedColumns = state.board.columns.map((column) => {
            // Try to find the task in this column
            const taskIndex = column.tasks.findIndex(
              (task) => task.id === taskId
            );

            // If task is found in this column
            if (taskIndex !== -1) {
              const updatedTasks = [...column.tasks];

              // Update the task with new properties and updatedAt timestamp
              updatedTasks[taskIndex] = {
                ...updatedTasks[taskIndex],
                ...updatedTask,
                updatedAt: new Date(),
              };

              // Return the updated column
              return {
                ...column,
                tasks: updatedTasks,
              };
            }

            // Return the column unchanged if task not found
            return column;
          });

          // Return updated board state
          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      /**
       * Deletes a task from any column
       */
      deleteTask: (taskId) => {
        set((state) => {
          // Remove the task from all columns (it should only exist in one)
          const updatedColumns = state.board.columns.map((column) => {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== taskId),
            };
          });

          // Return updated board state
          return {
            board: {
              ...state.board,
              columns: updatedColumns,
            },
          };
        });
      },

      /**
       * Moves a task from one column to another
       */
      moveTask: (taskId, destinationStatus) => {
        set((state) => {
          // Step 1: Find the task to move and its source column
          let taskToMove: Task | undefined;
          let sourceColumnIndex = -1;

          // Look through all columns to find the task
          state.board.columns.forEach((column, index) => {
            const task = column.tasks.find((t) => t.id === taskId);
            if (task) {
              taskToMove = { ...task }; // Clone the task
              sourceColumnIndex = index;
            }
          });

          // If task not found, return state unchanged
          if (!taskToMove || sourceColumnIndex === -1) {
            return state;
          }

          // Step 2: Remove the task from the source column
          const updatedColumns = [...state.board.columns];
          updatedColumns[sourceColumnIndex] = {
            ...updatedColumns[sourceColumnIndex],
            tasks: updatedColumns[sourceColumnIndex].tasks.filter(
              (task) => task.id !== taskId
            ),
          };

          // Step 3: Find the destination column and add the task with updated status
          const destinationColumnIndex = updatedColumns.findIndex(
            (col) => col.status === destinationStatus
          );

          if (destinationColumnIndex !== -1) {
            // Update the task with new status and updatedAt timestamp
            const updatedTask: Task = {
              ...taskToMove,
              status: destinationStatus,
              updatedAt: new Date(),
            };

            // Add the updated task to the destination column
            updatedColumns[destinationColumnIndex] = {
              ...updatedColumns[destinationColumnIndex],
              tasks: [
                ...updatedColumns[destinationColumnIndex].tasks,
                updatedTask,
              ],
            };
          }

          // Return updated board state
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
      // Handle potential issues with stored data
      onRehydrateStorage: () => (state) => {
        // Check if the stored data is valid
        if (!state || !state.board || !Array.isArray(state.board.columns)) {
          console.warn("Invalid stored data, using initial state instead");
          return { board: initialBoard };
        }
      },
    }
  )
);
