import React from 'react';
import { Board } from '../types/index.js';
import { useBoardStore } from '../stores/boardStore.js';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface CalendarViewProps {
  board: Board;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ board }) => {
  const { setSelectedTaskId } = useBoardStore();

  const allTasks = board.columns?.flatMap((col) => col.tasks) || [];
  const tasksWithDates = allTasks.filter((t) => t.dueDate || t.startDate);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-[#f8fafc] dark:bg-[#060911] transition-colors">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          Cronograma de Tareas ({tasksWithDates.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {tasksWithDates.map((task) => (
          <div
            key={task.id}
            onClick={() => setSelectedTaskId(task.id)}
            className="p-4 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] hover:border-blue-500 cursor-pointer shadow-xs transition"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Sin fecha'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#101a30] text-slate-600 dark:text-slate-300">
                {task.priority}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
              {task.title}
            </h3>
          </div>
        ))}

        {tasksWithDates.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 italic">
            No hay tareas con fechas asignadas en este tablero
          </div>
        )}
      </div>
    </div>
  );
};
