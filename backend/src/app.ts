import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';

// Rutas
import authRoutes from './modules/auth/auth.routes.js';
import workspaceRoutes from './modules/workspaces/workspaces.routes.js';
import projectRoutes from './modules/projects/projects.routes.js';
import boardRoutes from './modules/boards/boards.routes.js';
import columnRoutes from './modules/columns/columns.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import commentRoutes from './modules/comments/comments.routes.js';
import attachmentRoutes from './modules/attachments/attachments.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import teamsRoutes from './modules/teams/teams.routes.js';
import invitesRoutes from './modules/invites/invites.routes.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());

  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('vercel.app') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root endpoint para verificar despliegue en Vercel
  app.get('/', (req, res) => {
    res.json({
      name: 'FlowBoard API',
      status: 'online',
      version: '2.0',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Montar rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', boardRoutes);
  app.use('/api', columnRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', commentRoutes);
  app.use('/api', attachmentRoutes);
  app.use('/api', notificationRoutes);
  app.use('/api', dashboardRoutes);
  app.use('/api', usersRoutes);
  app.use('/api', teamsRoutes);
  app.use('/api', invitesRoutes);

  // Manejador centralizado de errores
  app.use(errorHandler);

  return app;
};
