import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useKanbanStore } from "@/store/useKanbanStore";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";
import Column from "./Column";
import TaskCard from "./TaskCard";
import CreateTaskDialog from "./CreateTaskDialog";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

const KanbanBoard: React.FC = () => {
  const { board, moveTask, updateTask } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null); // For drag overlay
  const [createDialogOpen, setCreateDialogOpen] = useState(false); // Controls dialog visibility
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined); // For edit mode
  // Tracks which column a new task should be created in (when using column-specific "+" button)
  const [currentColumnStatus, setCurrentColumnStatus] = useState<string>(
    TaskStatus.TODO
  );

  // Check if there's an issue with board data
  const hasBoardDataIssue = !board?.columns || !Array.isArray(board.columns);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5px before activating
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Event handlers for drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "Task") {
      setActiveTask(activeData.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Return if there's no change
    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Task over column
    if (activeData?.type === "Task" && overData?.type === "Column") {
      const task = activeData.task as Task;
      const destinationStatus = overData.column.status;

      // Only move if the status is different
      if (task.status !== destinationStatus) {
        moveTask(task.id, destinationStatus);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Return if no change
    if (activeId === overId) {
      setActiveTask(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    // Task over task (reordering)
    if (
      activeData?.type === "Task" &&
      overData?.type === "Task" &&
      activeData.task.status === overData.task.status
    ) {
      // Find the column containing these tasks
      const column = board.columns.find(
        (col) => col.status === activeData.task.status
      );

      if (column) {
        // Get the task indices
        const oldIndex = column.tasks.findIndex((t) => t.id === activeId);
        const newIndex = column.tasks.findIndex((t) => t.id === overId);

        // Reorder tasks in the column
        const newTasks = arrayMove(column.tasks, oldIndex, newIndex);

        // Update tasks with new order (we'd need to add ordering logic to our state)
        // This is a simplified approach, you might want to use an order field in your tasks
        newTasks.forEach((task, index) => {
          updateTask(task.id, { updatedAt: new Date(Date.now() + index) });
        });
      }
    }

    setActiveTask(null);
  };
  /**
   * Opens the edit dialog for an existing task
   * @param task - The task to edit
   */
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCreateDialogOpen(true);
  };

  /**
   * Opens the create task dialog for a specific column
   * This is triggered when clicking the "+" button in a column header
   * @param columnStatus - The status/column where the new task should be created
   */
  const handleCreateTaskInColumn = (columnStatus: string) => {
    setTaskToEdit(undefined); // Not in edit mode
    setCurrentColumnStatus(columnStatus); // Set the target column
    setCreateDialogOpen(true); // Open the dialog
  };

  // Function to clear localStorage and reload
  const resetBoardData = () => {
    localStorage.removeItem("kanban-storage");
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 p-2">
        <h1 className="text-xl font-bold">Kanban Board</h1>
        <div className="flex gap-2">
          {hasBoardDataIssue && (
            <Button onClick={resetBoardData} variant="destructive">
              Reset Board Data
            </Button>
          )}
          {/* Main "Add Task" button - creates tasks in the To Do column by default */}
          <Button
            onClick={() => {
              setTaskToEdit(undefined); // Not editing an existing task
              setCurrentColumnStatus(TaskStatus.TODO); // Default to TODO column
              setCreateDialogOpen(true); // Open the task creation dialog
            }}
          >
            <Plus className="mr-1" /> Add Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="flex gap-4 p-4">
            {board && board.columns && Array.isArray(board.columns) ? (
              board.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onEditTask={handleEditTask}
                  onCreateTask={handleCreateTaskInColumn} // Enables "+" button in column header
                />
              ))
            ) : (
              <div className="w-full text-center p-8">
                Loading board data...
              </div>
            )}
          </div>

          {/* Drag overlay - shows the task being dragged */}
          <DragOverlay>
            {activeTask && (
              <div className="w-80">
                <TaskCard task={activeTask} onEdit={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        taskToEdit={taskToEdit}
        initialColumnStatus={currentColumnStatus}
      />
    </div>
  );
};

export default KanbanBoard;
