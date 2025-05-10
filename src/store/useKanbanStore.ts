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

  /** Current status filter (undefined means no filter) */
  filterByStatus?: TaskStatus;

  /** Current priority filter (undefined means no filter) */
  filterByPriority?: TaskPriority;

  /**
   * Creates a new task in the specified column
   * @param title - The title of the task
   * @param description - Optional description of the task
   * @param status - Task status/column (defaults to TODO)
   * @param priority - Task priority level (defaults to MEDIUM)
   * @param dueDate - Optional due date for the task
   */
  createTask: (
    title: string,
    description?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    dueDate?: Date
  ) => void;

  /**
   * Updates an existing task and moves it between columns if status changes
   * @param taskId - ID of the task to update
   * @param updatedTask - Partial task object with fields to update
   * @remarks If the status field is updated, the task will be moved to the appropriate column
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

  /**
   * Sets the status filter
   * @param status - Status to filter by, undefined to clear the filter
   */
  setFilterStatus: (status?: TaskStatus) => void;

  /**
   * Sets the priority filter
   * @param priority - Priority to filter by, undefined to clear the filter
   */
  setFilterPriority: (priority?: TaskPriority) => void;

  /**
   * Clears all filters
   */
  clearFilters: () => void;

  /**
   * Gets tasks filtered by the current filters
   * @returns A new board with filtered tasks in each column
   */
  getFilteredBoard: () => Board;
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
    (set, get) => ({
      // ===== STATE =====
      board: initialBoard,
      filterByStatus: undefined,
      filterByPriority: undefined,

      // ===== ACTIONS =====

      /**
       * Creates a new task and adds it to the specified column based on status
       *
       * @param title - Task title (will be prefixed with a generated task code)
       * @param description - Optional task description
       * @param status - Which column to place the task in (default: TODO)
       * @param priority - Task priority level (default: MEDIUM)
       * @param dueDate - Optional due date for the task
       */
      createTask: (
        title,
        description,
        status = TaskStatus.TODO,
        priority = TaskPriority.MEDIUM,
        dueDate
      ) => {
        set((state) => {
          // Create a new task with unique ID and generated code
          const newTask: Task = {
            id: uuidv4(),
            title: `${generateTaskCode()} ${title}`,
            description,
            status,
            priority,
            createdAt: new Date(),
            ...(dueDate && { dueDate }),
          };

          // Find the column that matches the task's status and add the task to it
          const updatedColumns = state.board.columns.map((column) => {
            if (column.status === status) {
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
       * Updates an existing task's properties and moves it between columns if status changes
       *
       * This function handles both simple property updates and column movements when the status
       * field is changed. It works in two modes:
       * 1. If status is unchanged: Update the task properties in its current column
       * 2. If status is changed: Move the task to the appropriate column with its updated properties
       *
       * @param taskId - The ID of the task to update
       * @param updatedTask - Object containing the fields to update
       */
      updateTask: (taskId, updatedTask) => {
        set((state) => {
          // Step 1: Find the task and its current column
          let currentTask: Task | undefined;
          let sourceColumnIndex = -1;

          // Look through all columns to find the task
          state.board.columns.forEach((column, index) => {
            const task = column.tasks.find((t) => t.id === taskId);
            if (task) {
              currentTask = task;
              sourceColumnIndex = index;
            }
          });

          // If task not found, return state unchanged
          if (!currentTask || sourceColumnIndex === -1) {
            return state;
          } // Step 2: Check if the status is being changed (column movement needed)
          if (updatedTask.status && updatedTask.status !== currentTask.status) {
            // Status is changing - task needs to be moved to a different column

            // Create a new columns array for immutable update
            const updatedColumns = [...state.board.columns];

            // Step 3: Remove the task from its source/current column
            updatedColumns[sourceColumnIndex] = {
              ...updatedColumns[sourceColumnIndex],
              tasks: updatedColumns[sourceColumnIndex].tasks.filter(
                (task) => task.id !== taskId
              ),
            };

            // Step 4: Find the destination column based on the new status
            const destinationColumnIndex = updatedColumns.findIndex(
              (col) => col.status === updatedTask.status
            );

            if (destinationColumnIndex !== -1) {
              // Create the updated task with all new properties and timestamp
              const movedTask: Task = {
                ...currentTask,
                ...updatedTask,
                updatedAt: new Date(), // Update timestamp to reflect the change
              };

              // Add the updated task to the destination column
              updatedColumns[destinationColumnIndex] = {
                ...updatedColumns[destinationColumnIndex],
                tasks: [
                  ...updatedColumns[destinationColumnIndex].tasks,
                  movedTask,
                ],
              };
            }

            // Return the updated state
            return {
              board: {
                ...state.board,
                columns: updatedColumns,
              },
            };
          } else {
            // No status change - task stays in current column with updated properties
            // This follows a simpler update path without column movement
            const updatedColumns = state.board.columns.map((column) => {
              // Find the task in this column (should only be in one column)
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
          }
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
       *
       * Note: This function is used primarily for drag-and-drop operations.
       * For status changes made through the edit dialog, see the updateTask function
       * which also handles moving tasks between columns when status changes.
       *
       * @param taskId - The ID of the task to move
       * @param destinationStatus - The status representing the destination column
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

      /**
       * Sets the status filter
       * @param status - Status to filter by, undefined to clear the filter
       */
      setFilterStatus: (status) => {
        set(() => ({
          filterByStatus: status,
        }));
      },

      /**
       * Sets the priority filter
       * @param priority - Priority to filter by, undefined to clear the filter
       */
      setFilterPriority: (priority) => {
        set(() => ({
          filterByPriority: priority,
        }));
      },

      /**
       * Clears all filters
       */
      clearFilters: () => {
        set(() => ({
          filterByStatus: undefined,
          filterByPriority: undefined,
        }));
      },

      /**
       * Gets tasks filtered by the current filters
       * @returns A new board with filtered tasks in each column
       */
      getFilteredBoard: () => {
        const { board, filterByStatus, filterByPriority } = get();

        // Filter tasks based on the current filters
        const filteredColumns = board.columns.map((column) => {
          const filteredTasks = column.tasks.filter((task) => {
            const matchesStatus =
              filterByStatus === undefined || task.status === filterByStatus;
            const matchesPriority =
              filterByPriority === undefined ||
              task.priority === filterByPriority;
            return matchesStatus && matchesPriority;
          });

          return {
            ...column,
            tasks: filteredTasks,
          };
        });

        return {
          ...board,
          columns: filteredColumns,
        };
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
