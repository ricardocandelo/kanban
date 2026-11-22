import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { CommentsService } from './comments.service.js';
import { createCommentSchema } from './comments.schemas.js';
import { emitToBoard } from '../../sockets/index.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(authenticate as any);

router.post('/tasks/:taskId/comments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createCommentSchema.parse(req.body);
    const comment = await CommentsService.create(req.params.taskId, req.user!.userId, data);
    
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { column: true },
    });
    if (task) {
      emitToBoard(task.column.boardId, 'comment:created', { taskId: task.id, comment });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
});

router.delete('/comments/:commentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await CommentsService.delete(req.params.commentId, req.user!.userId);
    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
