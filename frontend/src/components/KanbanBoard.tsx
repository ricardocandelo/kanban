import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Board, Column, Task } from '../types/index.js';
import { KanbanColumn } from './KanbanColumn.js';
import { KanbanCard } from './KanbanCard.js';
import { api } from '../api/client.js';
import { useQueryClient } from '@tanstack/react-query';
import { useBoardStore } from '../stores/boardStore.js';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  board: Board;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ board }) => {
  const queryClient = useQueryClient();
  const { searchQuery, priorityFilter } = useBoardStore();

  const [columns, setColumns] = useState<Column[]>(board.columns || []);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const originalColumnsRef = useRef<Column[]>(board.columns || []);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current && board.columns) {
      setColumns(board.columns);
      originalColumnsRef.current = board.columns;
    }
  }, [board.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    originalColumnsRef.current = columns;

    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === activeId)
    );

    const overColumn =
      columns.find((col) => col.id === overId) ||
      columns.find((col) => col.tasks.some((t) => t.id === overId));

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      setColumns((prevCols) => {
        const sourceCol = prevCols.find((c) => c.id === activeColumn.id);
        const destCol = prevCols.find((c) => c.id === overColumn.id);
        if (!sourceCol || !destCol) return prevCols;

        const activeTaskIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
        if (activeTaskIndex === -1) return prevCols;

        const taskToMove = sourceCol.tasks[activeTaskIndex];

        const overTaskIndex = destCol.tasks.findIndex((t) => t.id === overId);
        let newIndex: number;

        if (overTaskIndex >= 0) {
          const isBelowOverItem =
            event.active.rect.current.translated &&
            event.active.rect.current.translated.top >
              over.rect.top + over.rect.height / 2;
          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overTaskIndex + modifier;
        } else {
          newIndex = destCol.tasks.length;
        }

        const newSourceTasks = sourceCol.tasks.filter((t) => t.id !== activeId);
        const newDestTasks = [...destCol.tasks];
        newDestTasks.splice(newIndex, 0, {
          ...taskToMove,
          columnId: destCol.id,
        });

        return prevCols.map((c) => {
          if (c.id === sourceCol.id) return { ...c, tasks: newSourceTasks };
          if (c.id === destCol.id) return { ...c, tasks: newDestTasks };
          return c;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const activeId = activeTask?.id || (event.active.id as string);
    setActiveTask(null);

    const { over } = event;
    if (!over) {
      setColumns(originalColumnsRef.current);
      return;
    }

    const overId = over.id as string;

    let currentColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === activeId)
    );

    if (!currentColumn) {
      currentColumn = columns.find((col) => col.id === overId);
    }

    if (!currentColumn) {
      setColumns(originalColumnsRef.current);
      return;
    }

    const activeTaskIndex = currentColumn.tasks.findIndex((t) => t.id === activeId);
    const overTaskIndex = currentColumn.tasks.findIndex((t) => t.id === overId);

    let finalTasks = currentColumn.tasks;
    if (activeTaskIndex !== -1 && overTaskIndex !== -1 && activeTaskIndex !== overTaskIndex) {
      finalTasks = arrayMove(currentColumn.tasks, activeTaskIndex, overTaskIndex);
      setColumns((prev) =>
        prev.map((col) => (col.id === currentColumn?.id ? { ...col, tasks: finalTasks } : col))
      );
    }

    const finalIndex = finalTasks.findIndex((t) => t.id === activeId);
    const prevTask = finalIndex > 0 ? finalTasks[finalIndex - 1] : null;
    const nextTask = finalIndex < finalTasks.length - 1 ? finalTasks[finalIndex + 1] : null;

    const prevPos = prevTask ? prevTask.position : null;
    const nextPos = nextTask ? nextTask.position : null;
    const targetColumnId = currentColumn.id;

    queryClient.setQueryData(['board', board.id], (old: Board | undefined) => {
      if (!old) return old;
      return {
        ...old,
        columns,
      };
    });

    api
      .post(`/tasks/${activeId}/move`, {
        targetColumnId,
        prevPos,
        nextPos,
      })
      .then((res) => {
        const updatedTask = res.data.data;
        if (updatedTask) {
          setColumns((prevCols) =>
            prevCols.map((c) => {
              if (c.id === targetColumnId) {
                return {
                  ...c,
                  tasks: c.tasks.map((t) => (t.id === activeId ? { ...t, position: updatedTask.position } : t)),
                };
              }
              return c;
            })
          );
        }
      })
      .catch((error) => {
        console.error('Error al persistir movimiento:', error);
        toast.error('No se pudo guardar la nueva posición');
        setColumns(originalColumnsRef.current);
        queryClient.invalidateQueries({ queryKey: ['board', board.id] });
      });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-3 sm:p-6 flex gap-3 sm:gap-4 items-start h-full bg-[#f8fafc] dark:bg-[#060911] transition-colors snap-x snap-mandatory scroll-smooth">
        {columns.map((col) => {
          const filteredTasks = col.tasks.filter((t) => {
            const matchesQuery =
              !searchQuery ||
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority =
              priorityFilter === 'ALL' || t.priority === priorityFilter;
            return matchesQuery && matchesPriority;
          });

          return <KanbanColumn key={col.id} column={col} tasks={filteredTasks} />;
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <div className="rotate-1 scale-102 shadow-2xl opacity-95 pointer-events-none w-[286px]">
            <KanbanCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
