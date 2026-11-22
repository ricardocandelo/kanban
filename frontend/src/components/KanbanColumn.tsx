import React, { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from '../types/index.js';
import { KanbanCard } from './KanbanCard.js';
import { Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const queryClient = useQueryClient();

  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const taskIds = tasks.map((t) => t.id);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      await api.post(`/columns/${column.id}/tasks`, {
        title: quickTitle.trim(),
      });
      setQuickTitle('');
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ['board', column.boardId] });
      toast.success('Tarea agregada');
    } catch {
      toast.error('Error al agregar tarea');
    }
  };

  const isWipExceeded = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <section
      ref={setNodeRef}
      className="w-[85vw] max-w-[310px] sm:w-[310px] shrink-0 snap-start flex flex-col max-h-full bg-slate-100/60 dark:bg-[#0b1120] rounded-2xl border border-slate-200/90 dark:border-[#1a2947] select-none transition-colors"
    >
      {/* Cabecera de Columna (Estilo FlowBoard) */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/70 dark:border-[#1a2947]/80">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: column.color || '#3B82F6' }}
          />
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[170px]">
            {column.name}
          </h2>
          <span
            className={`px-2 py-0.2 rounded-md text-[11px] font-mono font-medium ${
              isWipExceeded
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : 'text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-[#131f38]'
            }`}
          >
            {tasks.length}
            {column.wipLimit ? ` / ${column.wipLimit}` : ''}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-[#131f38] transition cursor-pointer"
          title={`Agregar tarea a ${column.name}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Tarjetas (Drop Zone) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px]">
        {/* Formulario rápido para añadir tarea */}
        {isAdding && (
          <form
            onSubmit={handleQuickCreate}
            className="bg-white dark:bg-[#101a30] p-3 rounded-xl border border-blue-500 shadow-sm"
          >
            <textarea
              autoFocus
              placeholder="¿Qué necesitas hacer?..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickCreate(e);
                }
              }}
              rows={2}
              className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-[#1a2947]">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
              >
                Añadir
              </button>
            </div>
          </form>
        )}

        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 italic border-2 border-dashed border-slate-200/80 dark:border-[#1a2947] rounded-xl">
            Sin tareas en esta fase
          </div>
        )}
      </div>
    </section>
  );
};
