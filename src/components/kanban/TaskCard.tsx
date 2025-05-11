/**
 * TaskCard Component
 *
 * Displays a single task card that can be dragged and dropped
 * between columns. Shows task details including title, description,
 * priority, and due date.
 */

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";
import { useKanbanStore } from "@/store/useKanbanStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Formats a date for display
 * @param date The date to format
 * @returns Formatted date string (e.g. "May 9")
 */
const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Returns appropriate CSS classes for priority badges
 * @param priority The task priority level
 * @returns CSS class string for styling the priority badge
 */
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
    case "low":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
};

/**
 * Props for the TaskCard component
 */
interface TaskCardProps {
  /** The task data to display */
  task: Task;
  /** Callback for when the edit button is clicked */
  onEdit: (task: Task) => void;
}

/**
 * TaskCard Component
 *
 * Displays a single task and enables drag-and-drop functionality.
 * Shows task details and provides edit and delete actions.
 */
const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask } = useKanbanStore();
  // Check if the task is in the "Done" status to apply special styling
  const isDone = task.status === TaskStatus.DONE;

  /**
   * Set up sortable (draggable) behavior using dnd-kit
   *
   * This attaches all the necessary props and handlers for drag and drop
   */
  const {
    attributes, // Attributes to spread on the draggable element
    listeners, // Event listeners for drag interactions
    setNodeRef, // Ref to attach to the draggable element
    transform, // Current transform value during drag
    transition, // Transition to apply during drag
    isDragging, // Whether the item is currently being dragged
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  // CSS styles for drag transform and transition
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Extract task code (e.g., "TASK-123") and title from the complete title string
  const taskCode = task.title.split(" ")[0]; // First part is the code
  const taskTitle = task.title.substring(taskCode.length + 1); // Rest is the title

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 ${isDragging ? "opacity-50" : ""} ${
        isDone ? "bg-gray-100 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"
      } touch-manipulation`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="px-3 pb-0 flex flex-row items-start justify-between">
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {taskCode}
          </div>
          <h3
            className={`font-medium truncate ${
              isDone ? "line-through text-gray-500 dark:text-gray-400" : ""
            }`}
          >
            {taskTitle}
          </h3>
        </div>
        {/* Actions dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
              <MoreVertical className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {/* Edit action */}
            <DropdownMenuItem
              onClick={() => onEdit(task)}
              className="cursor-pointer py-2"
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            {/* Delete action with warning color */}
            <DropdownMenuItem
              onClick={() => deleteTask(task.id)}
              className="text-red-600 dark:text-red-400 cursor-pointer py-2"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {/* Task description (if present) */}
      <CardContent className="p-3">
        {task.description && (
          <p
            className={`text-sm text-gray-600 dark:text-gray-300 break-words ${
              isDone ? "line-through text-gray-500 dark:text-gray-400" : ""
            }`}
          >
            {/* Display limited text on very small screens */}
            <span className="line-clamp-3">{task.description}</span>
          </p>
        )}
      </CardContent>

      {/* Card footer with priority badge and due date */}
      <CardFooter className="px-3 py-2 flex flex-wrap justify-between items-center gap-2">
        {/* Priority badge with color-coding */}
        <span
          className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {/* Due date (if present) */}
        {task.dueDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Due {formatDate(task.dueDate)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
