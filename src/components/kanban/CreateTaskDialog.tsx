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
import { TaskPriority } from "@/types";
import type { Task } from "@/types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  taskToEdit,
}) => {
  const { createTask, updateTask } = useKanbanStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  const isEditMode = Boolean(taskToEdit);

  // Update form values when taskToEdit or open changes
  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        // Extract the task title without the task code (e.g., "TASK-123")
        const taskTitle = taskToEdit.title.split(" ");
        taskTitle.shift(); // Remove the first element (TASK-XXX)
        setTitle(taskTitle.join(" "));
        setDescription(taskToEdit.description || "");
        setPriority(taskToEdit.priority);
        setDueDate(
          taskToEdit.dueDate
            ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
            : ""
        );
      } else {
        // Reset form for create mode
        setTitle("");
        setDescription("");
        setPriority(TaskPriority.MEDIUM);
        setDueDate("");
      }
      setErrors({});
    }
  }, [taskToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    if (isEditMode && taskToEdit) {
      updateTask(taskToEdit.id, {
        title: `${taskToEdit.title.split(" ")[0]} ${title}`,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
    } else {
      createTask(
        title,
        description || undefined,
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
