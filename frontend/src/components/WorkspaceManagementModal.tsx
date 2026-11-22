import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { Workspace } from '../types/index.js';

interface WorkspaceManagementModalProps {
  mode: 'create' | 'delete';
  workspace: Workspace | null;
  onClose: () => void;
}

export const WorkspaceManagementModal: React.FC<WorkspaceManagementModalProps> = ({
  mode,
  workspace,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addWorkspace, removeWorkspace } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/workspaces', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      return res.data.data as Workspace;
    },
    onSuccess: (createdWorkspace) => {
      addWorkspace({ ...createdWorkspace, role: 'OWNER' });
      toast.success('Espacio de trabajo creado');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear el espacio');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error('No hay un espacio de trabajo seleccionado');
      await api.delete(`/workspaces/${workspace.id}`, {
        data: { confirmationName: confirmation },
      });
    },
    onSuccess: () => {
      if (!workspace) return;
      removeWorkspace(workspace.id);
      queryClient.removeQueries({ queryKey: ['projects', workspace.id] });
      queryClient.removeQueries({ queryKey: ['dashboard', workspace.id] });
      queryClient.removeQueries({ queryKey: ['teams', workspace.id] });
      navigate('/dashboard', { replace: true });
      toast.success('Espacio de trabajo y sus datos eliminados');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el espacio');
    },
  });

  const isCreating = mode === 'create';
  const canDelete = !!workspace && confirmation === workspace.name;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1a2947] dark:bg-[#0b1120]">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-[#1a2947]">
          <div className="flex items-center gap-2.5">
            {isCreating ? (
              <Building2 className="h-5 w-5 text-blue-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isCreating ? 'Crear espacio de trabajo' : 'Eliminar espacio de trabajo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isCreating ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim().length >= 2) createMutation.mutate();
            }}
            className="space-y-4 p-6"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El nuevo espacio quedará bajo tu propiedad. Luego podrás invitar personas y crear proyectos.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nombre *
              </label>
              <input
                autoFocus
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Marketing"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-[#1a2947] dark:bg-[#101a30] dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descripción
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Opcional"
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-[#1a2947] dark:bg-[#101a30] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-[#1a2947]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101a30]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || name.trim().length < 2}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear espacio'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 p-6">
            <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-xs text-slate-700 dark:text-slate-300">
              <p>
                Se eliminará permanentemente <strong>{workspace?.name}</strong>, junto con todos sus proyectos,
                tableros, tareas, equipos y miembros. Esta acción no se puede deshacer.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Escribe <strong>{workspace?.name}</strong> para confirmar
              </label>
              <input
                autoFocus
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none dark:border-[#1a2947] dark:bg-[#101a30] dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-[#1a2947]">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101a30]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canDelete || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
