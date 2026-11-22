import { Router } from 'express';
import { InvitesController } from './invites.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas (sin auth)
router.get('/invite/:token', InvitesController.validateToken as any);

// Rutas protegidas
router.post('/projects/:projectId/invite-links', authenticate as any, InvitesController.createLink as any);
router.get('/projects/:projectId/invite-links', authenticate as any, InvitesController.listLinks as any);
router.post('/invite/:token/accept', authenticate as any, InvitesController.acceptInvite as any);
router.delete('/invite-links/:linkId', authenticate as any, InvitesController.revokeLink as any);

export default router;
