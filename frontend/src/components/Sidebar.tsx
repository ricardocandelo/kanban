import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  FolderKanban,
  Users,
  LogOut,
  ChevronDown,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Project } from '../types/index.js';

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenNewProject: () => void;
  onOpenUsersAndTeams: () => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile = false,
  onCloseMobile,
  onOpenNewProject,
  onOpenUsersAndTeams,
  onOpenProfile,
}) => {
  const { user, currentWorkspace, workspaces, setCurrentWorkspace, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const res = await api.get(`/workspaces/${currentWorkspace.id}/projects`);
      return res.data.data;
    },
    enabled: !!currentWorkspace?.id,
  });

  const handleNavClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="w-[260px] sm:w-[250px] shrink-0 bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-[#1a2947] flex flex-col h-full text-slate-700 dark:text-slate-300 select-none shadow-xl lg:shadow-none transition-colors">
      {/* Brand (Estilo FlowBoard) con Botón Cerrar en Móvil */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#1a2947]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/25">
            <Kanban className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-[17px]">
              FlowBoard
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 font-mono font-medium">
              v2.0
            </span>
          </div>
        </div>

        {/* Botón cerrar para móvil / tablet */}
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#101a30] transition lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selector de Workspace */}
      <div className="p-3 border-b border-slate-200/80 dark:border-[#1a2947]/70">
        <div className="relative group">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#101a30] hover:bg-slate-100 dark:hover:bg-[#14203b] text-left border border-slate-200 dark:border-[#1a2947] transition">
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 rounded bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold">
                {currentWorkspace?.name.charAt(0) || 'W'}
              </div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {currentWorkspace?.name || 'Seleccionar espacio'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
          </button>

          {/* Menú desplegable workspaces */}
          <div className="hidden group-hover:block absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] rounded-xl shadow-xl z-50 py-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Mis Espacios
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setCurrentWorkspace(ws);
                  handleNavClick();
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#162544] transition ${
                  ws.id === currentWorkspace?.id
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="truncate">{ws.name}</span>
                {ws.role && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-[#070b14] rounded text-slate-500 dark:text-slate-400">
                    {ws.role}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación Principal */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Sección General */}
        <div className="space-y-0.5">
          <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            General
          </div>
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#101a30]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 opacity-80" />
            <span>Panel</span>
          </NavLink>

          <button
            onClick={() => {
              onOpenUsersAndTeams();
              handleNavClick();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#101a30] transition text-left cursor-pointer"
          >
            <Users className="w-4 h-4 opacity-80 text-blue-500" />
            <span>Usuarios y equipos</span>
          </button>
        </div>

        {/* Sección Proyectos */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Proyectos
            </span>
            <button
              onClick={() => {
                onOpenNewProject();
                handleNavClick();
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              title="Crear nuevo proyecto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No hay proyectos activos</div>
          ) : (
            projects.map((proj) => {
              const defaultBoardId = proj.boards?.[0]?.id;
              return (
                <div key={proj.id} className="space-y-0.5">
                  <div
                    onClick={() => {
                      if (defaultBoardId) navigate(`/boards/${defaultBoardId}`);
                      handleNavClick();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101a30] hover:text-slate-900 dark:hover:text-white cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FolderKanban className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] px-1 rounded bg-slate-100 dark:bg-[#101a30] text-slate-400 font-mono">
                      {proj.key}
                    </span>
                  </div>

                  {/* Sub-tableros del proyecto */}
                  {proj.boards?.map((b) => (
                    <NavLink
                      key={b.id}
                      to={`/boards/${b.id}`}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg text-[12px] transition ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#101a30]'
                        }`
                      }
                    >
                      <Kanban className="w-3.5 h-3.5 opacity-60" />
                      <span className="truncate">{b.name}</span>
                    </NavLink>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pie de Usuario */}
      <div className="p-3 border-t border-slate-200 dark:border-[#1a2947] bg-slate-50/50 dark:bg-[#070b14]/50">
        <div className="flex items-center justify-between">
          <div
            onClick={() => {
              onOpenProfile();
              handleNavClick();
            }}
            className="flex items-center gap-2.5 truncate cursor-pointer group flex-1 p-1 -m-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#101a30] transition"
            title="Ver y editar mi perfil"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName}
                className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-[#1a2947] group-hover:border-blue-500 transition shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </div>
            )}
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {user?.isSuperAdmin ? 'Super Administrador' : 'Miembro'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition ml-1 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
