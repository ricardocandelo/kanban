import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Board } from '../types/index.js';
import { useBoardStore } from '../stores/boardStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { KanbanBoard } from '../components/KanbanBoard.js';
import { ListView } from '../components/ListView.js';
import { CalendarView } from '../components/CalendarView.js';

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { setActiveBoard, viewMode } = useBoardStore();

  // Socket en tiempo real para este tablero
  useSocket(boardId);

  const { data: board, isLoading, error } = useQuery<Board>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get(`/boards/${boardId}`);
      return res.data.data;
    },
    enabled: !!boardId,
  });

  useEffect(() => {
    if (board) {
      setActiveBoard(board);
    }
    return () => setActiveBoard(null);
  }, [board, setActiveBoard]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Cargando tablero Kanban...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tablero no encontrado
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            El tablero solicitado no existe o no cuentas con los permisos requeridos para acceder a él.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {viewMode === 'kanban' && <KanbanBoard board={board} />}
      {viewMode === 'list' && <ListView board={board} />}
      {viewMode === 'calendar' && <CalendarView board={board} />}
    </div>
  );
};
