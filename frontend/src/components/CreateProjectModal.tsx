import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { X, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateProjectModalProps {
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/workspaces/${currentWorkspace?.id}/projects`, {
        name,
        key: key.toUpperCase().trim(),
        description: description || undefined,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', currentWorkspace?.id] });
      toast.success('Proyecto creado con éxito');
      onClose();
    },
    onError: () => {
      toast.error('Error al crear el proyecto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    createProjectMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-md border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Nuevo Proyecto</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Módulo de Facturación"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!key && e.target.value.length >= 3) {
                  setKey(e.target.value.substring(0, 4).toUpperCase());
                }
              }}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clave / Prefijo (2-6 caracteres) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="FACT"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Objetivos y alcance del proyecto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
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
              disabled={createProjectMutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {createProjectMutation.isPending ? 'Guardando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
