import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { InvitesService } from './invites.service.js';

export class InvitesController {
  /** POST /api/projects/:projectId/invite-links */
  static async createLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      const { role = 'MEMBER', expiresInDays } = req.body;
      if (!['VIEWER', 'MEMBER', 'ADMIN'].includes(role)) {
        res.status(400).json({ success: false, message: 'El permiso de invitación no es válido' });
        return;
      }
      if (expiresInDays !== undefined && (!Number.isInteger(expiresInDays) || expiresInDays < 0)) {
        res.status(400).json({ success: false, message: 'La vigencia debe ser un número entero positivo' });
        return;
      }
      const link = await InvitesService.createLink(projectId, userId, role, expiresInDays);
      res.status(201).json({ success: true, data: link });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/projects/:projectId/invite-links */
  static async listLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;
      const links = await InvitesService.listLinks(projectId, userId);
      res.json({ success: true, data: links });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/invite/:token  (público) */
  static async validateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const data = await InvitesService.validateToken(token);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/invite/:token/accept  (requiere auth) */
  static async acceptInvite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const userId = req.user!.userId;
      const result = await InvitesService.acceptInvite(token, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/invite-links/:linkId  (requiere auth) */
  static async revokeLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { linkId } = req.params;
      const userId = req.user!.userId;
      await InvitesService.revokeLink(linkId, userId);
      res.json({ success: true, message: 'Enlace revocado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}
