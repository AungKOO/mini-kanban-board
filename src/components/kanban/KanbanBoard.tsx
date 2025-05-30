import React, { useState, useCallback } from "react";
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
import FilterBar from "./FilterBar";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

const KanbanBoard: React.FC = () => {
  const { board, moveTask, updateTask, getFilteredBoard } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null); // For drag overlay
  const [createDialogOpen, setCreateDialogOpen] = useState(false); // Controls dialog visibility
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined); // For edit mode
  // Tracks which column a new task should be created in (when using column-specific "+" button)
  const [currentColumnStatus, setCurrentColumnStatus] = useState<string>(
    TaskStatus.TODO
  );

  // Get the filtered board data based on current filters
  const filteredBoard = getFilteredBoard();

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

  // Event handlers for drag and drop - memoized to prevent recreation on each render
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "Task") {
      setActiveTask(activeData.task);
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
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
    },
    [moveTask]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
    },
    [board, updateTask, setActiveTask]
  );
  /**
   * Opens the edit dialog for an existing task
   * @param task - The task to edit
   */
  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
    setCreateDialogOpen(true);
  }, []);

  /**
   * Opens the create task dialog for a specific column
   * This is triggered when clicking the "+" button in a column header
   * @param columnStatus - The status/column where the new task should be created
   */
  const handleCreateTaskInColumn = useCallback((columnStatus: string) => {
    setTaskToEdit(undefined); // Not in edit mode
    setCurrentColumnStatus(columnStatus); // Set the target column
    setCreateDialogOpen(true); // Open the dialog
  }, []);

  // Function to clear localStorage and reload
  const resetBoardData = () => {
    localStorage.removeItem("kanban-storage");
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full overscroll-none">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 p-2">
        <h1 className="text-xl font-bold">Kanban Board</h1>
        <div className="flex flex-wrap gap-2">
          {hasBoardDataIssue && (
            <Button
              onClick={resetBoardData}
              variant="destructive"
              size="sm"
              className="whitespace-nowrap"
            >
              Reset Data
            </Button>
          )}
          {/* Main "Add Task" button - creates tasks in the To Do column by default */}
          <Button
            onClick={() => {
              setTaskToEdit(undefined); // Not editing an existing task
              setCurrentColumnStatus(TaskStatus.TODO); // Default to TODO column
              setCreateDialogOpen(true); // Open the task creation dialog
            }}
            size="sm"
            className="whitespace-nowrap"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Filter bar for filtering tasks */}
      <div className="px-2">
        <FilterBar />
      </div>

      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="flex flex-col md:flex-row gap-4 p-4">
            {filteredBoard &&
            filteredBoard.columns &&
            Array.isArray(filteredBoard.columns) ? (
              <>
                {filteredBoard.columns.map((column) => (
                  <Column
                    key={column.id}
                    column={column}
                    onEditTask={handleEditTask}
                    onCreateTask={handleCreateTaskInColumn} // Enables "+" button in column header
                  />
                ))}

                {/* Show message when no tasks match the filters */}
                {filteredBoard.columns.every(
                  (col) => col.tasks.length === 0
                ) && (
                  <div className="w-full text-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                    <p>No tasks match the current filters.</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Try adjusting your filters or create new tasks.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full text-center p-8">
                Loading board data...
              </div>
            )}
          </div>

          {/* Drag overlay - shows the task being dragged */}
          <DragOverlay>
            {activeTask && (
              <div className="w-full md:w-80">
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
