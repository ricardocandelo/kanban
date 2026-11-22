import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types/index.js';
import {
  MessageSquare,
  Paperclip,
  Flag,
} from 'lucide-react';
import { useBoardStore } from '../stores/boardStore.js';

interface KanbanCardProps {
  task: Task;
}

const PRIORITY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: 'Urgente', color: '#EF4444', bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' },
  HIGH: { label: 'Alta', color: '#3B82F6', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25' },
  MEDIUM: { label: 'Media', color: '#0EA5E9', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25' },
  LOW: { label: 'Baja', color: '#64748B', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { setSelectedTaskId } = useBoardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 150ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const commentsCount = task._count?.comments ?? task.comments?.length ?? 0;
  const attachmentsCount = task._count?.attachments ?? task.attachments?.length ?? 0;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTaskId(task.id)}
      className="group bg-white dark:bg-[#101a30] hover:bg-slate-50/80 dark:hover:bg-[#14213d] rounded-xl p-3.5 border border-slate-200 dark:border-[#1a2947] hover:border-slate-300 dark:hover:border-[#2b416e] shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none flex flex-col gap-2.5"
    >
      {/* Metadatos: Prioridad con Flag + Etiquetas */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 shrink-0 ${priority.bg}`}
        >
          <Flag className="w-3 h-3" style={{ color: priority.color }} />
          <span>{priority.label}</span>
        </span>

        {task.labels?.map((tl) => (
          <span
            key={tl.label.id}
            style={{
              backgroundColor: `${tl.label.color}15`,
              borderColor: `${tl.label.color}35`,
              color: tl.label.color,
            }}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium border truncate max-w-[140px]"
          >
            {tl.label.name}
          </span>
        ))}
      </div>

      {/* Título de la tarea */}
      <h3 className="text-[13px] font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {task.title}
      </h3>

      {/* Progreso de Subtareas (Estilo FlowBoard) */}
      {totalSubtasks > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Subtareas</span>
            <span className="font-mono text-[10px]">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1c2d50] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${subtaskPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Pie de Tarjeta: Comentarios, Archivos y Avatares */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1a2947]/70 text-slate-400 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[11px] hover:text-slate-600 dark:hover:text-slate-200 transition">
            <MessageSquare className="w-3.5 h-3.5 opacity-70" />
            <span>{commentsCount}</span>
          </span>

          {attachmentsCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] hover:text-slate-600 dark:hover:text-slate-200 transition">
              <Paperclip className="w-3.5 h-3.5 opacity-70" />
              <span>{attachmentsCount}</span>
            </span>
          )}
        </div>

        {/* Avatares */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {task.assignees?.slice(0, 3).map((a) => (
            <div
              key={a.id}
              title={`${a.user.firstName} ${a.user.lastName}`}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#101a30] bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 shadow-xs"
            >
              {a.user.avatarUrl ? (
                <img src={a.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                a.user.firstName.charAt(0)
              )}
            </div>
          ))}
          {(task.assignees?.length || 0) > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#101a30] bg-slate-600 text-white flex items-center justify-center text-[9px] font-bold">
              +{(task.assignees?.length || 0) - 3}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
