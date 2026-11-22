import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { TasksService } from './tasks.service.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  manageAssigneesSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from './tasks.schemas.js';
import { emitToBoard } from '../../sockets/index.js';

export class TasksController {
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await TasksService.getById(req.params.taskId);
      res.json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = await TasksService.create(req.params.columnId, req.user!.userId, data);
      
      const fullTask = await TasksService.getById(task.id);
      emitToBoard(fullTask.column.boardId, 'task:created', fullTask);

      res.status(201).json({ success: true, data: fullTask });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateTaskSchema.parse(req.body);
      await TasksService.update(req.params.taskId, req.user!.userId, data);
      
      const fullTask = await TasksService.getById(req.params.taskId);
      emitToBoard(fullTask.column.boardId, 'task:updated', fullTask);

      res.json({ success: true, data: fullTask });
    } catch (error) {
      next(error);
    }
  }

  static async move(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = moveTaskSchema.parse(req.body);
      await TasksService.move(req.params.taskId, req.user!.userId, data);
      
      const fullTask = await TasksService.getById(req.params.taskId);
      emitToBoard(fullTask.column.boardId, 'task:moved', {
        taskId: fullTask.id,
        columnId: fullTask.columnId,
        position: fullTask.position,
        task: fullTask,
      });

      res.json({ success: true, data: fullTask });
    } catch (error) {
      next(error);
    }
  }

  static async setAssignees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = manageAssigneesSchema.parse(req.body);
      const assignees = await TasksService.setAssignees(req.params.taskId, data.userIds);
      
      const fullTask = await TasksService.getById(req.params.taskId);
      emitToBoard(fullTask.column.boardId, 'task:assigned', { taskId: fullTask.id, assignees });

      res.json({ success: true, data: assignees });
    } catch (error) {
      next(error);
    }
  }

  static async createSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createSubtaskSchema.parse(req.body);
      const subtask = await TasksService.createSubtask(req.params.taskId, data);
      
      const fullTask = await TasksService.getById(req.params.taskId);
      emitToBoard(fullTask.column.boardId, 'task:updated', fullTask);

      res.status(201).json({ success: true, data: subtask });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateSubtaskSchema.parse(req.body);
      const subtask = await TasksService.updateSubtask(req.params.subtaskId, data);
      res.json({ success: true, data: subtask });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubtask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await TasksService.deleteSubtask(req.params.subtaskId);
      res.json({ success: true, message: 'Subtarea eliminada' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fullTask = await TasksService.getById(req.params.taskId);
      const boardId = fullTask.column.boardId;
      await TasksService.delete(req.params.taskId);
      
      emitToBoard(boardId, 'task:deleted', { taskId: req.params.taskId });
      res.json({ success: true, message: 'Tarea eliminada con éxito' });
    } catch (error) {
      next(error);
    }
  }
}
