/**
 * Column Component
 *
 * Represents a column in the Kanban board that contains tasks.
 * Handles the droppable area for tasks and renders task cards.
 */
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column as ColumnType, Task } from "@/types";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

/**
 * Props for the Column component
 */
interface ColumnProps {
  /** The column data to display */
  column: ColumnType;
  /** Callback for when a task is edited */
  onEditTask: (task: Task) => void;
  /** Callback for creating a new task in this column */
  onCreateTask?: (columnStatus: string) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  onEditTask,
  onCreateTask,
}) => {
  // Set up droppable functionality for drag and drop
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
    data: {
      type: "Column",
      column,
    },
  });

  /**
   * Task Sorting Logic
   *
   * 1. Ensure column.tasks is an array (defensive programming)
   * 2. Sort tasks by their updated or created date (newest first)
   */
  const tasks = Array.isArray(column.tasks) ? column.tasks : [];
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.updatedAt || a.createdAt;
    const dateB = b.updatedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="w-full md:w-80 flex-shrink-0 flex flex-col mb-4 md:mb-0">
      {/* Column header */}
      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-md">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 truncate mr-2">
            {column.title}
          </h2>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Column-specific "Add Task" button */}
            {onCreateTask && (
              <button
                onClick={() => onCreateTask(column.status)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title={`Create task in ${column.title}`}
                aria-label={`Add new task to ${column.title}`}
              >
                <Plus size={16} />
              </button>
            )}
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
              {column.tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Task list container - this is the droppable area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-grow min-h-[200px] p-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-md",
          // Highlight the column when a task is being dragged over it
          isOver && "bg-blue-50 dark:bg-blue-950/30"
        )}
      >
        {/* SortableContext enables sorting tasks within this column */}
        <SortableContext
          items={sortedTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Render all tasks in this column */}
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>

        {/* Empty state - displayed when there are no tasks */}
        {(!column.tasks || column.tasks.length === 0) && (
          <div className="text-center p-2 sm:p-4 text-gray-400 dark:text-gray-500 text-xs sm:text-sm italic min-h-[50px] flex items-center justify-center">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
