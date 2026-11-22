import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

router.get('/me', authenticate as any, AuthController.getMe as any);
router.patch('/profile', authenticate as any, AuthController.updateProfile as any);
router.post('/change-password', authenticate as any, AuthController.changePassword as any);

export default router;
