import { Router } from 'express';
import { ProjectsController } from './projects.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.get('/workspaces/:workspaceId/projects', ProjectsController.list as any);
router.post('/workspaces/:workspaceId/projects', ProjectsController.create as any);

router.get('/projects/:projectId', ProjectsController.getById as any);
router.patch('/projects/:projectId', ProjectsController.update as any);
router.delete('/projects/:projectId', ProjectsController.delete as any);

export default router;
