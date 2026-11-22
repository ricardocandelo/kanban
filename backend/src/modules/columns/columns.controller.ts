import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { ColumnsService } from './columns.service.js';
import { createColumnSchema, updateColumnSchema, reorderColumnSchema } from './columns.schemas.js';

export class ColumnsController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createColumnSchema.parse(req.body);
      const column = await ColumnsService.create(req.params.boardId, data);
      res.status(201).json({ success: true, data: column });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateColumnSchema.parse(req.body);
      const column = await ColumnsService.update(req.params.columnId, data);
      res.json({ success: true, data: column });
    } catch (error) {
      next(error);
    }
  }

  static async reorder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = reorderColumnSchema.parse(req.body);
      const column = await ColumnsService.reorder(req.params.columnId, data);
      res.json({ success: true, data: column });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await ColumnsService.delete(req.params.columnId);
      res.json({ success: true, message: 'Columna eliminada con éxito' });
    } catch (error) {
      next(error);
    }
  }
}
