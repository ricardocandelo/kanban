import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { config } from '../config/env.js';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  // Autenticación de socket mediante JWT handshake
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Autenticación requerida'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    // console.log(`[Socket] Usuario conectado: ${user.email} (${socket.id})`);

    // Unirse a la sala del tablero
    socket.on('board:join', (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on('board:leave', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    // Unirse a la sala del workspace
    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Desconectado: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado');
  }
  return io;
};

export const emitToBoard = (boardId: string, event: string, data: any) => {
  if (io) {
    io.to(`board:${boardId}`).emit(event, data);
  }
};

export const emitToWorkspace = (workspaceId: string, event: string, data: any) => {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
};
