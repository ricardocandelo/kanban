import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { BadRequestError, ConflictError, ForbiddenError } from '../../utils/errors.js';
import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

const router = Router();
router.use(authenticate as any);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatarUrl: z.string().url().optional().nullable(),
  isSuperAdmin: z.boolean().default(false),
  workspaceId: z.string().optional(),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
});

// Listar y buscar usuarios (por nombre o correo)
router.get('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    const workspaceId = req.query.workspaceId as string;
    const requester = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isSuperAdmin: true },
    });

    if (!requester?.isSuperAdmin) {
      if (!workspaceId) {
        throw new ForbiddenError('Solo un Super Administrador puede consultar usuarios globalmente');
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user!.userId,
          },
        },
      });
      if (!membership) {
        throw new ForbiddenError('No perteneces a este espacio de trabajo');
      }
      if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
        const managedTeam = await prisma.team.findFirst({
          where: {
            workspaceId,
            OR: [
              { createdById: req.user!.userId },
              {
                members: {
                  some: {
                    userId: req.user!.userId,
                    OR: [{ canManage: true }, { role: 'LEADER' }],
                  },
                },
              },
            ],
          },
          select: { id: true },
        });
        if (!managedTeam) {
          throw new ForbiddenError('Solo administradores o gestores de equipo pueden consultar usuarios');
        }
      }
    }

    const userSelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
    };
    const select = requester?.isSuperAdmin
      ? { ...userSelect, isSuperAdmin: true, workspaces: { select: { workspaceId: true, role: true } } }
      : userSelect;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { email: { contains: q, mode: 'insensitive' } },
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
          workspaceId
            ? {
                workspaces: {
                  some: { workspaceId },
                },
              }
            : {},
        ],
      },
      select,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Crear nuevo usuario (Super Admin o Admin de Workspace)
router.post('/users', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Validar si el solicitante es Super Admin o Admin del Workspace
    const requester = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    const data = createUserSchema.parse(req.body);

    if (!requester?.isSuperAdmin) {
      if (!data.workspaceId) {
        throw new ForbiddenError('Solo un Super Administrador puede crear usuarios globales');
      }
      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: data.workspaceId, userId: req.user!.userId } },
      });
      if (!member || member.role === 'MEMBER') {
        throw new ForbiddenError('Permisos insuficientes para crear usuarios');
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestError('El correo electrónico ya se encuentra registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl,
          isSuperAdmin: requester?.isSuperAdmin ? data.isSuperAdmin : false,
        },
      });

      if (data.workspaceId) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: data.workspaceId,
            userId: u.id,
            role: data.role,
          },
        });
      }

      return u;
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatarUrl: newUser.avatarUrl,
        isSuperAdmin: newUser.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar usuario (Perfil, Foto, Permisos, Activación)
router.patch('/users/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const requester = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    const isSelf = req.user!.userId === req.params.userId;
    if (!isSelf && !requester?.isSuperAdmin) {
      throw new ForbiddenError('Permisos insuficientes');
    }

    const { firstName, lastName, avatarUrl, isActive, isSuperAdmin } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        firstName,
        lastName,
        avatarUrl,
        isActive: requester?.isSuperAdmin ? isActive : undefined,
        isSuperAdmin: requester?.isSuperAdmin ? isSuperAdmin : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
        isSuperAdmin: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Cambiar estado activo / inactivo
router.patch('/users/:userId/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!requester?.isSuperAdmin) {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: req.user!.userId, role: { in: ['OWNER', 'ADMIN'] } },
      });
      if (!member) throw new ForbiddenError('Permisos insuficientes para activar/desactivar usuarios');
    }

    if (req.user!.userId === req.params.userId) {
      throw new BadRequestError('No puedes desactivar tu propia cuenta');
    }

    const { isActive } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: typeof isActive === 'boolean' ? isActive : undefined },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    res.json({
      success: true,
      message: `Usuario ${updated.isActive ? 'activado' : 'desactivado'} con éxito`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Restablecer contraseña de un usuario por Administrador
router.post('/users/:userId/reset-password', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!requester?.isSuperAdmin) {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: req.user!.userId, role: { in: ['OWNER', 'ADMIN'] } },
      });
      if (!member) throw new ForbiddenError('Permisos insuficientes para cambiar contraseñas');
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('La contraseña debe tener al menos 6 caracteres');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.params.userId },
      data: { passwordHash },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: req.params.userId } });

    res.json({ success: true, message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    next(error);
  }
});

// Eliminar usuario permanentemente
router.delete('/users/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!requester?.isSuperAdmin) {
      throw new ForbiddenError('Solo un Super Administrador puede eliminar usuarios permanentemente');
    }

    if (req.user!.userId === req.params.userId) {
      throw new BadRequestError('No puedes eliminar tu propia cuenta');
    }

    const ownedWorkspace = await prisma.workspace.findFirst({
      where: { ownerId: req.params.userId },
      select: { id: true },
    });
    if (ownedWorkspace) {
      throw new ConflictError(
        'No se puede eliminar este usuario porque es propietario de un espacio de trabajo. Desactiva su cuenta o transfiere la propiedad antes de eliminarlo.'
      );
    }

    const createdTask = await prisma.task.findFirst({
      where: { createdById: req.params.userId },
      select: { id: true },
    });
    if (createdTask) {
      throw new ConflictError(
        'No se puede eliminar este usuario porque tiene tareas creadas. Desactiva su cuenta o reasigna/elimina sus tareas antes de eliminarlo.'
      );
    }

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: req.params.userId } }),
      prisma.taskAssignee.deleteMany({ where: { userId: req.params.userId } }),
      prisma.taskWatcher.deleteMany({ where: { userId: req.params.userId } }),
      prisma.teamMember.deleteMany({ where: { userId: req.params.userId } }),
      prisma.projectMember.deleteMany({ where: { userId: req.params.userId } }),
      prisma.workspaceMember.deleteMany({ where: { userId: req.params.userId } }),
      prisma.user.delete({ where: { id: req.params.userId } }),
    ]);

    res.json({ success: true, message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    next(error);
  }
});

export default router;
