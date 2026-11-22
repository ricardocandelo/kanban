import { Router } from 'express';
import { BoardsController } from './boards.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.get('/projects/:projectId/boards', BoardsController.list as any);
router.post('/projects/:projectId/boards', BoardsController.create as any);

router.get('/boards/:boardId', BoardsController.getById as any);
router.patch('/boards/:boardId', BoardsController.update as any);
router.delete('/boards/:boardId', BoardsController.delete as any);

export default router;
