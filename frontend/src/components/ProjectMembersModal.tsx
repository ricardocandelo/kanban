import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { User, Team } from '../types/index.js';
import {
  X,
  UserPlus,
  Users,
  Layers,
  Search,
  Check,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectMembersModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectId,
  projectName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'members' | 'add_user' | 'add_team'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Obtener miembros actuales del proyecto
  const { data: projectData } = useQuery<{ members: (User & { source: string })[]; teams: Team[] }>({
    queryKey: ['project_members', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/members`);
      return res.data.data;
    },
  });

  // 2. Obtener usuarios globales del workspace para poder agregar
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['users', searchQuery, currentWorkspace?.id],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { q: searchQuery || undefined, workspaceId: currentWorkspace?.id },
      });
      return res.data.data;
    },
  });

  // 3. Obtener equipos del workspace para poder vincular
  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ['teams', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const res = await api.get(`/workspaces/${currentWorkspace.id}/teams`);
      return res.data.data;
    },
    enabled: !!currentWorkspace?.id,
  });

  // Mutación: Agregar usuario individual al proyecto
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/projects/${projectId}/members`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_members', projectId] });
      toast.success('Usuario agregado al proyecto');
    },
    onError: () => {
      toast.error('Error al agregar usuario al proyecto');
    },
  });

  // Mutación: Vincular equipo completo al proyecto
  const addTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.post(`/projects/${projectId}/teams`, { teamId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_members', projectId] });
      toast.success('Equipo vinculado al proyecto');
    },
    onError: () => {
      toast.error('Error al vincular equipo');
    },
  });

  // Mutación: Remover miembro del proyecto
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_members', projectId] });
      toast.success('Miembro removido');
    },
    onError: () => {
      toast.error('Error al remover miembro');
    },
  });

  const currentMembers = projectData?.members || [];
  const memberIds = new Set(currentMembers.map((m) => m.id));

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Miembros del Proyecto: {projectName}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Administra quiénes tienen acceso al proyecto y pueden recibir asignación de tareas.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-[#1a2947] bg-slate-50/50 dark:bg-[#0b1120] gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'members'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Miembros Actuales ({currentMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('add_user')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'add_user'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Agregar por Usuario
          </button>
          <button
            onClick={() => setActiveTab('add_team')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'add_team'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            + Vincular Equipo Completo
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MIEMBROS ACTUALES */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              {currentMembers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No hay miembros asignados a este proyecto
                </div>
              ) : (
                currentMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-[#1a2947]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {m.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.firstName} {m.lastName}
                          </span>
                          {m.isSuperAdmin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{m.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#16233d] text-slate-600 dark:text-slate-300">
                        {m.source === 'direct' ? 'Directo' : m.source.replace('team:', 'Equipo: ')}
                      </span>
                      {m.source === 'direct' && (
                        <button
                          onClick={() => removeMemberMutation.mutate(m.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remover del proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: AGREGAR POR USUARIO */}
          {activeTab === 'add_user' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {allUsers.map((u) => {
                  const isAlreadyMember = memberIds.has(u.id);
                  return (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-[#1a2947]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {u.firstName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>

                      {isAlreadyMember ? (
                        <span className="text-[11px] font-semibold text-blue-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Ya es Miembro
                        </span>
                      ) : (
                        <button
                          onClick={() => addMemberMutation.mutate(u.id)}
                          disabled={addMemberMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition"
                        >
                          + Agregar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VINCULAR EQUIPO COMPLETO */}
          {activeTab === 'add_team' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Al vincular un equipo, todos sus miembros quedarán automáticamente inscritos en este proyecto para asignarles tareas.
              </p>

              <div className="space-y-3">
                {allTeams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {team.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#16233d] text-slate-600 dark:text-slate-300">
                          {team.members?.length || 0} integrantes
                        </span>
                      </div>
                      {team.description && (
                        <p className="text-[11px] text-slate-400">{team.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => addTeamMutation.mutate(team.id)}
                      disabled={addTeamMutation.isPending}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition shrink-0"
                    >
                      Vincular Equipo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
