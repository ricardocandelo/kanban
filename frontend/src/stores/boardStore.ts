import { create } from 'zustand';
import { Board, Task, TaskPriority } from '../types/index.js';

interface BoardState {
  activeBoard: Board | null;
  selectedTaskId: string | null;
  searchQuery: string;
  priorityFilter: TaskPriority | 'ALL';
  viewMode: 'kanban' | 'list' | 'calendar';
  setActiveBoard: (board: Board | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: TaskPriority | 'ALL') => void;
  setViewMode: (mode: 'kanban' | 'list' | 'calendar') => void;
  updateTaskOptimistic: (task: Partial<Task> & { id: string }) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeBoard: null,
  selectedTaskId: null,
  searchQuery: '',
  priorityFilter: 'ALL',
  viewMode: 'kanban',

  setActiveBoard: (board) => set({ activeBoard: board }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setViewMode: (mode) => set({ viewMode: mode }),

  updateTaskOptimistic: (updatedTask) =>
    set((state) => {
      if (!state.activeBoard) return state;

      const newColumns = state.activeBoard.columns?.map((col) => {
        const taskExists = col.tasks.some((t) => t.id === updatedTask.id);
        if (!taskExists) return col;

        return {
          ...col,
          tasks: col.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
        };
      });

      return {
        activeBoard: {
          ...state.activeBoard,
          columns: newColumns,
        },
      };
    }),
}));
