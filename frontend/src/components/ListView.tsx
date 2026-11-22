import React from 'react';
import { Board, Task } from '../types/index.js';
import { useBoardStore } from '../stores/boardStore.js';
import { Flag, CheckCircle2, Circle } from 'lucide-react';

interface ListViewProps {
  board: Board;
}

export const ListView: React.FC<ListViewProps> = ({ board }) => {
  const { setSelectedTaskId, searchQuery, priorityFilter } = useBoardStore();

  const allTasks: (Task & { columnName: string; columnColor: string })[] = [];
  board.columns?.forEach((col) => {
    col.tasks.forEach((task) => {
      allTasks.push({
        ...task,
        columnName: col.name,
        columnColor: col.color,
      });
    });
  });

  const filteredTasks = allTasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-[#f8fafc] dark:bg-[#060911] transition-colors">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl border border-slate-200 dark:border-[#1a2947] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1a2947] bg-slate-50/60 dark:bg-[#101a30]/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tarea</th>
                <th className="py-3 px-4">Estado / Columna</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Fecha Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1a2947]/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No hay tareas que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="hover:bg-slate-50 dark:hover:bg-[#101a30] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-md truncate">
                      <div className="flex items-center gap-2">
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 w-max"
                        style={{
                          backgroundColor: `${task.columnColor}15`,
                          color: task.columnColor,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: task.columnColor }}
                        />
                        {task.columnName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {task.assignees?.[0] ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {task.assignees[0].user.firstName} {task.assignees[0].user.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin asignar</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
