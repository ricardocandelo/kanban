import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../config/db.js';

const router = Router();
router.use(authenticate as any);

router.get('/workspaces/:workspaceId/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { workspaceId } = req.params;

    // Obtener todos los proyectos del workspace
    const projects = await prisma.project.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true, key: true },
    });

    const projectIds = projects.map((p) => p.id);

    // Tableros asociados
    const boards = await prisma.board.findMany({
      where: { projectId: { in: projectIds }, isArchived: false },
      select: { id: true, name: true },
    });

    const boardIds = boards.map((b) => b.id);

    // Columnas
    const columns = await prisma.column.findMany({
      where: { boardId: { in: boardIds } },
      select: { id: true, isDone: true, name: true },
    });

    const columnIds = columns.map((c) => c.id);
    const doneColumnIds = columns.filter((c) => c.isDone).map((c) => c.id);

    // Conteo de tareas
    const totalTasks = await prisma.task.count({
      where: { columnId: { in: columnIds }, isArchived: false },
    });

    const completedTasks = await prisma.task.count({
      where: {
        columnId: { in: doneColumnIds },
        isArchived: false,
      },
    });

    const now = new Date();
    const overdueTasks = await prisma.task.count({
      where: {
        columnId: { in: columnIds },
        dueDate: { lt: now },
        isCompleted: false,
        isArchived: false,
      },
    });

    // Tareas por prioridad
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: { columnId: { in: columnIds }, isArchived: false },
      _count: true,
    });

    // Actividad reciente
    const recentActivity = await prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalProjects: projects.length,
          totalBoards: boards.length,
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          overdueTasks,
        },
        priorityCounts: priorityCounts.map((p) => ({
          priority: p.priority,
          count: p._count,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
