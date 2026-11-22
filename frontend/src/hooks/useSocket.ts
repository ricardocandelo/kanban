import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (boardId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('flowboard_access_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('[Socket.IO] Conectado exitosamente');
      if (boardId) {
        socket.emit('board:join', boardId);
      }
    });

    // Escucha de eventos en tiempo real
    socket.on('task:created', () => {
      if (boardId) queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    socket.on('task:updated', () => {
      if (boardId) queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    socket.on('task:moved', () => {
      if (boardId) queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    socket.on('task:deleted', () => {
      if (boardId) queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    socket.on('comment:created', () => {
      if (boardId) queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    return () => {
      if (boardId) {
        socket.emit('board:leave', boardId);
      }
      socket.disconnect();
    };
  }, [boardId, queryClient]);

  return socketRef.current;
};
