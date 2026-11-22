import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { WorkspacesService } from './workspaces.service.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './workspaces.schemas.js';

export class WorkspacesController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspacesService.listUserWorkspaces(req.user!.userId);
      res.json({ success: true, data: workspaces });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspacesService.getById(req.params.workspaceId, req.user!.userId);
      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createWorkspaceSchema.parse(req.body);
      const workspace = await WorkspacesService.create(req.user!.userId, data);
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateWorkspaceSchema.parse(req.body);
      const workspace = await WorkspacesService.update(req.params.workspaceId, data);
      res.json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { confirmationName } = deleteWorkspaceSchema.parse(req.body);
      await WorkspacesService.delete(req.params.workspaceId, confirmationName);
      res.json({ success: true, message: 'Espacio de trabajo eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const members = await WorkspacesService.listMembers(req.params.workspaceId);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = inviteMemberSchema.parse(req.body);
      const invitation = await WorkspacesService.inviteMember(
        req.params.workspaceId,
        req.user!.userId,
        data
      );
      res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await WorkspacesService.acceptInvitation(token, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateMemberRoleSchema.parse(req.body);
      const member = await WorkspacesService.updateMemberRole(
        req.params.workspaceId,
        req.params.userId,
        data
      );
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await WorkspacesService.removeMember(req.params.workspaceId, req.params.userId);
      res.json({ success: true, message: 'Miembro removido con éxito' });
    } catch (error) {
      next(error);
    }
  }
}
