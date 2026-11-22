import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller.js';
import { authenticate, requireWorkspaceRole } from '../../middlewares/auth.middleware.js';
import { WorkspaceRole } from '@prisma/client';

const router = Router();

router.use(authenticate as any);

router.get('/', WorkspacesController.list as any);
router.post('/', WorkspacesController.create as any);
router.get('/:workspaceId', WorkspacesController.getById as any);
router.patch(
  '/:workspaceId',
  requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]) as any,
  WorkspacesController.update as any
);
router.delete(
  '/:workspaceId',
  requireWorkspaceRole([WorkspaceRole.OWNER]) as any,
  WorkspacesController.delete as any
);

// Miembros
router.get('/:workspaceId/members', WorkspacesController.listMembers as any);
router.post(
  '/:workspaceId/invitations',
  requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]) as any,
  WorkspacesController.inviteMember as any
);
router.post('/invitations/:token/accept', WorkspacesController.acceptInvitation as any);
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole([WorkspaceRole.OWNER]) as any,
  WorkspacesController.updateMemberRole as any
);
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]) as any,
  WorkspacesController.removeMember as any
);

export default router;
