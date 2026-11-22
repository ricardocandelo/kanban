import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { BoardsService } from './boards.service.js';
import { createBoardSchema, updateBoardSchema } from './boards.schemas.js';

export class BoardsController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const boards = await BoardsService.listByProject(req.params.projectId);
      res.json({ success: true, data: boards });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const board = await BoardsService.getById(req.params.boardId);
      res.json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createBoardSchema.parse(req.body);
      const board = await BoardsService.create(req.params.projectId, data);
      res.status(201).json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateBoardSchema.parse(req.body);
      const board = await BoardsService.update(req.params.boardId, data);
      res.json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await BoardsService.delete(req.params.boardId);
      res.json({ success: true, message: 'Tablero eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }
}
