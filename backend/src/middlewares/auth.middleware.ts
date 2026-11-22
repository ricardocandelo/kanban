import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/tokens.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../config/db.js';
import { WorkspaceRole } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  workspaceMember?: {
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado o inválido');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    next(new UnauthorizedError('Sesión expirada o token inválido'));
  }
};

export const requireWorkspaceRole = (allowedRoles: WorkspaceRole[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        (req.query.workspaceId as string);

      if (!workspaceId) {
        throw new ForbiddenError('Identificador de Workspace requerido');
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenError('No perteneces a este espacio de trabajo');
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenError('No tienes los permisos requeridos en este espacio');
      }

      req.workspaceMember = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};
