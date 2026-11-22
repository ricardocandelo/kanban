import { Router } from 'express';
import { TasksController } from './tasks.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/columns/:columnId/tasks', TasksController.create as any);
router.get('/tasks/:taskId', TasksController.getById as any);
router.patch('/tasks/:taskId', TasksController.update as any);
router.post('/tasks/:taskId/move', TasksController.move as any);
router.put('/tasks/:taskId/assignees', TasksController.setAssignees as any);
router.delete('/tasks/:taskId', TasksController.delete as any);

// Subtareas
router.post('/tasks/:taskId/subtasks', TasksController.createSubtask as any);
router.patch('/subtasks/:subtaskId', TasksController.updateSubtask as any);
router.delete('/subtasks/:subtaskId', TasksController.deleteSubtask as any);

export default router;
