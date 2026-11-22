import { Router } from 'express';
import { ColumnsController } from './columns.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/boards/:boardId/columns', ColumnsController.create as any);
router.patch('/columns/:columnId', ColumnsController.update as any);
router.post('/columns/:columnId/reorder', ColumnsController.reorder as any);
router.delete('/columns/:columnId', ColumnsController.delete as any);

export default router;
