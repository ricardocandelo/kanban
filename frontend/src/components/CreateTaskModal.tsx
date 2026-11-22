import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Board, TaskPriority } from '../types/index.js';
import { X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
  board: Board;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ board, onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(board.columns?.[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  // Obtener miembros del proyecto para asignar
  const { data: projectMembersData } = useQuery<{ members: any[] }>({
    queryKey: ['project_members_for_create_task', board.projectId],
    queryFn: async () => {
      if (!board.projectId) return { members: [] };
      const res = await api.get(`/projects/${board.projectId}/members`);
      return res.data.data;
    },
    enabled: !!board.projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
      };
      const res = await api.post(`/columns/${columnId}/tasks`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', board.id] });
      toast.success('Tarea creada exitosamente');
      onClose();
    },
    onError: () => {
      toast.error('Error al crear tarea');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;
    createTaskMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-lg border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Crear Nueva Tarea</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título de la Tarea *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Implementar sincronización offline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Detalles y criterios de aceptación..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Columna de Inicio
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {board.columns?.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha de Entrega
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Selector de Asignados */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Asignar Responsables
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              {projectMembersData?.members?.map((m: any) => {
                const isSelected = selectedAssigneeIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      setSelectedAssigneeIds((prev) =>
                        isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                      );
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition border ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-slate-700 text-white font-bold text-[8px] flex items-center justify-center">
                        {m.firstName.charAt(0)}
                      </div>
                    )}
                    <span>{m.firstName}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1a2947]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#101a30]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
