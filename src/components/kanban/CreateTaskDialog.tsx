/**
 * CreateTaskDialog Component
 *
 * A modal dialog for creating new tasks or editing existing ones.
 * Handles form validation and submission.
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKanbanStore } from "@/store/useKanbanStore";
import { TaskPriority, TaskStatus } from "@/types";
import type { Task } from "@/types";

/**
 * Props for the CreateTaskDialog component
 *
 * This component serves two purposes:
 * 1. Create new tasks - with optional initialColumnStatus to specify the column
 * 2. Edit existing tasks - with ability to change status and move between columns
 */
interface CreateTaskDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;

  /** Callback for when the dialog open state changes */
  onOpenChange: (open: boolean) => void;

  /**
   * Optional task to edit (undefined for create mode)
   * When provided, puts the dialog in "edit mode" with task data populated
   */
  taskToEdit?: Task;

  /**
   * Optional initial column status for new tasks
   * Determines which column a new task will be placed in
   * Useful when adding a task directly to a specific column
   */
  initialColumnStatus?: string;
}

/**
 * CreateTaskDialog Component
 *
 * Used for both creating new tasks and editing existing ones.
 */
const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  taskToEdit,
  initialColumnStatus,
}) => {
  // Access task-related actions from the store
  const { createTask, updateTask } = useKanbanStore();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Determine if we're in edit or create mode
  const isEditMode = Boolean(taskToEdit);

  /**
   * Update form values when the dialog opens or inputs change
   *
   * This effect handles two main scenarios:
   * 1. Edit mode - Populates form with existing task data (including its status/column)
   * 2. Create mode - Initializes a blank form with default values and the specified column status
   *
   * The effect runs when:
   * - Dialog opens/closes (open changes)
   * - Task to edit changes (switching between tasks or edit/create modes)
   * - initialColumnStatus changes (when creating tasks from different columns)
   */
  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        // EDIT MODE: Populate form with existing task data

        // Extract the task title without the task code (e.g., "TASK-123")
        const taskTitle = taskToEdit.title.split(" ");
        taskTitle.shift(); // Remove the first element (TASK-XXX)

        setTitle(taskTitle.join(" "));
        setDescription(taskToEdit.description || "");
        setStatus(taskToEdit.status); // Set status to task's current column
        setPriority(taskToEdit.priority);
        setDueDate(
          taskToEdit.dueDate
            ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
            : ""
        );
      } else {
        // CREATE MODE: Reset form with default values

        setTitle("");
        setDescription("");
        setStatus(initialColumnStatus || TaskStatus.TODO); // Use specified column or default to TODO
        setPriority(TaskPriority.MEDIUM);
        setDueDate("");
      }
      setErrors({});
    }
  }, [taskToEdit, open, initialColumnStatus]);

  /**
   * Handles form submission for both creating and editing tasks
   * In edit mode: Updates an existing task (preserves task code)
   * In create mode: Creates a new task in the specified column
   *
   * @param e - The form submit event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    if (isEditMode && taskToEdit) {
      // Update existing task, preserving the task code prefix
      updateTask(taskToEdit.id, {
        title: `${taskToEdit.title.split(" ")[0]} ${title}`, // Keep the task code (TASK-XXX)
        description: description || undefined,
        status: status as TaskStatus, // This will move the task to the proper column
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
    } else {
      // Create a new task in the specified column (status)
      createTask(
        title,
        description || undefined,
        status as TaskStatus, // Determines which column the task appears in
        priority,
        dueDate ? new Date(dueDate) : undefined
      );
    }

    // Close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
              placeholder="Enter task title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-xs">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          {/* Status dropdown - determines which column the task will appear in */}
          <div className="space-y-2">
            <label
              htmlFor="status"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Status
            </label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO:: I will add backlog later as there is no need currently right now. */}
                {/* <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>  */}
                <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>
                  In Progress
                </SelectItem>
                <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="priority"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Priority
            </label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TaskPriority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="dueDate"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Due Date
            </label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
