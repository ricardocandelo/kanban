import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { AttachmentsService } from './attachments.service.js';
import { saveAttachmentSchema, signUploadSchema } from './attachments.schemas.js';
import { emitToBoard } from '../../sockets/index.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(authenticate as any);

// Obtener firma segura para subida directa desde el navegador
router.post('/attachments/sign', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = signUploadSchema.parse(req.body);
    const signatureData = AttachmentsService.getUploadSignature(data.folder);
    res.json({ success: true, data: signatureData });
  } catch (error) {
    next(error);
  }
});

// Guardar metadatos tras subida exitosa a Cloudinary
router.post('/tasks/:taskId/attachments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = saveAttachmentSchema.parse(req.body);
    const attachment = await AttachmentsService.create(req.params.taskId, req.user!.userId, data);
    
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { column: true },
    });
    if (task) {
      emitToBoard(task.column.boardId, 'attachment:uploaded', { taskId: task.id, attachment });
    }

    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    next(error);
  }
});

// Eliminar archivo
router.delete('/attachments/:attachmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await AttachmentsService.delete(req.params.attachmentId);
    res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
