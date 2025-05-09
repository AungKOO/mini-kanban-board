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

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask } = useKanbanStore();
  const isDone = task.status === TaskStatus.DONE;

  // Set up sortable (draggable) behavior
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Extract task code and title
  const taskCode = task.title.split(" ")[0];
  const taskTitle = task.title.substring(taskCode.length + 1);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 ${isDragging ? "opacity-50" : ""} ${
        isDone ? "bg-gray-100 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"
      }`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between">
        <div>
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {taskCode}
          </div>
          <h3
            className={`font-medium ${
              isDone ? "line-through text-gray-500 dark:text-gray-400" : ""
            }`}
          >
            {taskTitle}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteTask(task.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3">
        {task.description && (
          <p
            className={`text-sm text-gray-600 dark:text-gray-300 ${
              isDone ? "line-through text-gray-500 dark:text-gray-400" : ""
            }`}
          >
            {task.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="px-3 py-2 flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Due {formatDate(task.dueDate)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
