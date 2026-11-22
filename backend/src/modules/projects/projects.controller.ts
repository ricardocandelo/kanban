import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { ProjectsService } from './projects.service.js';
import { createProjectSchema, updateProjectSchema } from './projects.schemas.js';

export class ProjectsController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projects = await ProjectsService.listByWorkspace(req.params.workspaceId);
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await ProjectsService.getById(req.params.projectId);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createProjectSchema.parse(req.body);
      const project = await ProjectsService.create(req.params.workspaceId, data);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateProjectSchema.parse(req.body);
      const project = await ProjectsService.update(req.params.projectId, data);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await ProjectsService.delete(req.params.projectId);
      res.json({ success: true, message: 'Proyecto eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }
}
