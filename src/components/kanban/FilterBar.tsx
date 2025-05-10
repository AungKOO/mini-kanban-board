/**
 * FilterBar Component
 *
 * Provides UI for filtering tasks in the Kanban board by status or priority.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority, TaskStatus } from "@/types";
import { useKanbanStore } from "@/store/useKanbanStore";
import { Filter, X } from "lucide-react";

/**
 * Status display text mapping
 */
const statusNames = {
  [TaskStatus.BACKLOG]: "Backlog",
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

/**
 * Priority display text mapping
 */
const priorityNames = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
};

// Special value for "Any" options in selects - must not be empty string
const ANY_STATUS = "any_status";
const ANY_PRIORITY = "any_priority";

/**
 * Filter bar component for filtering tasks
 */
const FilterBar: React.FC = React.memo(() => {
  const {
    filterByStatus,
    filterByPriority,
    setFilterStatus,
    setFilterPriority,
    clearFilters,
  } = useKanbanStore();

  // Check if any filter is active
  const hasActiveFilters = Boolean(filterByStatus || filterByPriority);

  // Get filtered board to show filtered task count
  const filteredBoard = useKanbanStore().getFilteredBoard();

  // Calculate total number of filtered tasks
  const taskCount = filteredBoard.columns.reduce(
    (total, column) => total + column.tasks.length,
    0
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-background border border-border/40 rounded-lg">
      <div className="flex items-center gap-2 mr-1">
        <Filter size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Filters
        </span>
      </div>

      {/* Status filter */}
      <Select
        value={filterByStatus || ANY_STATUS}
        onValueChange={(value) => {
          // Convert ANY_STATUS to undefined, or keep the TaskStatus value
          setFilterStatus(
            value === ANY_STATUS ? undefined : (value as TaskStatus)
          );
        }}
      >
        <SelectTrigger className="w-[130px] h-9 text-sm">
          <SelectValue placeholder="Status: Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_STATUS}>Any Status</SelectItem>
          <SelectItem value={TaskStatus.BACKLOG}>
            {statusNames[TaskStatus.BACKLOG]}
          </SelectItem>
          <SelectItem value={TaskStatus.TODO}>
            {statusNames[TaskStatus.TODO]}
          </SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>
            {statusNames[TaskStatus.IN_PROGRESS]}
          </SelectItem>
          <SelectItem value={TaskStatus.DONE}>
            {statusNames[TaskStatus.DONE]}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select
        value={filterByPriority || ANY_PRIORITY}
        onValueChange={(value) => {
          // Convert ANY_PRIORITY to undefined, or keep the TaskPriority value
          setFilterPriority(
            value === ANY_PRIORITY ? undefined : (value as TaskPriority)
          );
        }}
      >
        <SelectTrigger className="w-[130px] h-9 text-sm">
          <SelectValue placeholder="Priority: Any" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_PRIORITY}>Any Priority</SelectItem>
          <SelectItem value={TaskPriority.LOW}>
            {priorityNames[TaskPriority.LOW]}
          </SelectItem>
          <SelectItem value={TaskPriority.MEDIUM}>
            {priorityNames[TaskPriority.MEDIUM]}
          </SelectItem>
          <SelectItem value={TaskPriority.HIGH}>
            {priorityNames[TaskPriority.HIGH]}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Task count */}
      <div className="ml-auto flex items-center">
        <span className="text-sm text-muted-foreground">
          {taskCount} {taskCount === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Clear filters button, only shown when filters are active */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="h-8 ml-2 text-xs"
        >
          <X size={14} className="mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
});

export default FilterBar;
