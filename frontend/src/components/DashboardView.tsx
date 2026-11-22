import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Kanban,
  Activity,
  TrendingUp,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { currentWorkspace } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return null;
      const res = await api.get(`/workspaces/${currentWorkspace.id}/dashboard`);
      return res.data.data;
    },
    enabled: !!currentWorkspace?.id,
  });

  if (isLoading || !dashboard) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, priorityCounts, recentActivity } = dashboard;
  const completionRate =
    summary.totalTasks > 0
      ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
      : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-[#f8fafc] dark:bg-[#060911] transition-colors">
      {/* Título de Bienvenida */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Panel de Control — {currentWorkspace?.name}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Métricas generales y avance de proyectos en tiempo real.
        </p>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Tareas</span>
            <Kanban className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.totalTasks}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Completadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.completedTasks}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            {completionRate}% de avance
          </span>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pendientes</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.pendingTasks}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.overdueTasks}
          </div>
        </div>
      </div>

      {/* Gráficos / Distribución y Actividad Reciente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Distribución por Prioridad */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Tareas por Prioridad
          </h2>
          <div className="space-y-3">
            {priorityCounts.map((pc: any) => (
              <div key={pc.priority} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{pc.priority}</span>
                  <span className="text-slate-400 font-mono">{pc.count}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-[#16233d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${summary.totalTasks > 0 ? (pc.count / summary.totalTasks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed de Actividad Reciente */}
        <div className="md:col-span-2 p-5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Actividad Reciente del Workspace
          </h2>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-2">
            {recentActivity.map((act: any) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200/60 dark:border-[#1a2947]/70 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {act.user.firstName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {act.user.firstName} {act.user.lastName}
                    </span>{' '}
                    <span className="text-slate-500">ejecutó</span>{' '}
                    <span className="font-mono text-blue-500 font-semibold">{act.action}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(act.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
