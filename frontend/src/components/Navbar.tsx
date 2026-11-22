import React from 'react';
import {
  Search,
  Plus,
  Users,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { useBoardStore } from '../stores/boardStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { TaskPriority } from '../types/index.js';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  onOpenCreateTask: () => void;
  onOpenProjectMembers?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenCreateTask,
  onOpenProjectMembers,
}) => {
  const {
    activeBoard,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    viewMode,
    setViewMode,
  } = useBoardStore();

  const { theme, toggle: toggleTheme } = useThemeStore();

  return (
    <header className="h-[60px] border-b border-slate-200 dark:border-[#1a2947] bg-white dark:bg-[#0b1120] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none transition-colors">
      {/* Botón Menú Hamburguesa + Título y Subtítulo */}
      <div className="flex items-center gap-2.5 sm:gap-6 min-w-0">
        {/* Hamburguesa en pantallas < lg */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101a30] transition shrink-0 cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">
          <h1 className="text-xs sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
            {activeBoard?.name || 'Tablero de control y fases'}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-sm hidden sm:block">
            {activeBoard?.project?.name || 'FormX, módulo de captación de datos y panel global'}
          </p>
        </div>

        {/* Pestañas de Vista (En pantallas >= sm) */}
        <div className="hidden sm:flex items-center gap-3 md:gap-5 ml-1 border-b-0 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`pb-1 text-xs md:text-[13px] font-medium border-b-2 transition ${
              viewMode === 'kanban'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`pb-1 text-xs md:text-[13px] font-medium border-b-2 transition ${
              viewMode === 'list'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`pb-1 text-xs md:text-[13px] font-medium border-b-2 transition ${
              viewMode === 'calendar'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* Acciones Responsivas: Miembros, Buscador, Filtro, Tema y Botón Nueva Tarea */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {activeBoard?.project && onOpenProjectMembers && (
          <button
            onClick={onOpenProjectMembers}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-[#111a2e] dark:hover:bg-[#162544] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1a2947] transition"
            title="Gestionar miembros y equipos"
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Miembros</span>
          </button>
        )}

        {/* Buscador de tareas */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-2 py-1 w-24 sm:w-36 md:w-52 h-[34px] sm:h-[38px] rounded-lg bg-white dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filtro Prioridad (Solo en pantallas medianas hacia arriba) */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
          className="h-[34px] sm:h-[38px] px-2 rounded-lg bg-white dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer hidden md:block"
        >
          <option value="ALL">Todas las prioridades</option>
          <option value="URGENT">Urgente</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>

        {/* Botón Modo Noche / Día */}
        <button
          onClick={toggleTheme}
          className="w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-lg border border-slate-200 dark:border-[#1a2947] bg-white dark:bg-[#101a30] hover:border-slate-300 dark:hover:border-[#2b416e] flex items-center justify-center text-slate-600 dark:text-amber-400 transition cursor-pointer shadow-xs shrink-0"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Botón Principal Nueva Tarea */}
        <button
          onClick={onOpenCreateTask}
          className="h-[34px] sm:h-[38px] px-2.5 sm:px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer shrink-0"
          title="Nueva tarea"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva tarea</span>
        </button>
      </div>
    </header>
  );
};
