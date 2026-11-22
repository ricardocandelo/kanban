import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(authenticate as any);

router.get('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    next(error);
  }
});

router.patch('/notifications/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
});

export default router;
