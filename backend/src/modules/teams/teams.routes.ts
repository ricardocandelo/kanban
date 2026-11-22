import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, authenticate } from '../../middlewares/auth.middleware.js';
import { prisma } from '../../config/db.js';
import { z } from 'zod';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';

const router = Router();
router.use(authenticate as any);

const createTeamSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  color: z.string().default('#10B981'),
  memberIds: z.array(z.string()).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

/**
 * Validador de permisos de gestión sobre un equipo:
 * - Super Administrador
 * - Creador del equipo (createdById)
 * - Propietario (OWNER) o Admin del Workspace
 * - Miembro con permiso explícito (canManage === true o role === 'LEADER')
 */
export async function canUserManageTeam(teamId: string, userId: string): Promise<{ allowed: boolean; team: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      workspace: {
        include: {
          members: { where: { userId } },
        },
      },
      members: { where: { userId } },
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  if (!team) return { allowed: false, team: null };

  // 1. Super Admin
  if (user?.isSuperAdmin) {
    return { allowed: true, team };
  }

  // 2. Creador del equipo
  if (team.createdById === userId) {
    return { allowed: true, team };
  }

  // 3. Owner o Admin del Workspace
  const wsMember = team.workspace?.members[0];
  if (wsMember && (wsMember.role === 'OWNER' || wsMember.role === 'ADMIN')) {
    return { allowed: true, team };
  }

  // 4. Miembro con permiso de gestión delegado (canManage === true o role === 'LEADER')
  const tm = team.members[0];
  if (tm && (tm.canManage || tm.role === 'LEADER')) {
    return { allowed: true, team };
  }

  return { allowed: false, team };
}

// Listar equipos de un Workspace (incluyendo creador y permisos de gestión del usuario actual)
router.get('/workspaces/:workspaceId/teams', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isSuperAdmin: true },
    });
    const isSuperAdmin = !!user?.isSuperAdmin;

    if (!isSuperAdmin) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: req.params.workspaceId,
            userId: currentUserId,
          },
        },
      });
      if (!membership) throw new ForbiddenError('No perteneces a este espacio de trabajo');
    }

    const teams = await prisma.team.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
        workspace: {
          include: {
            members: { where: { userId: currentUserId } },
          },
        },
        _count: {
          select: { members: true, projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agregar flag `userCanManage` para que el frontend habilite o deshabilite botones de edición
    const enrichedTeams = teams.map((team) => {
      const isCreator = team.createdById === currentUserId;
      const wsRole = team.workspace?.members[0]?.role;
      const isWsAdmin = wsRole === 'OWNER' || wsRole === 'ADMIN';
      const userMember = team.members.find((m) => m.userId === currentUserId);
      const hasDelegatedPermission = userMember ? (userMember.canManage || userMember.role === 'LEADER') : false;

      const userCanManage = isSuperAdmin || isCreator || isWsAdmin || hasDelegatedPermission;

      return {
        ...(!userCanManage
          ? {
              ...team,
              workspace: undefined,
              creator: team.creator
                ? {
                    id: team.creator.id,
                    firstName: team.creator.firstName,
                    lastName: team.creator.lastName,
                    avatarUrl: team.creator.avatarUrl,
                  }
                : null,
              members: team.members.map((member) => ({
                id: member.id,
                teamId: member.teamId,
                userId: member.userId,
                createdAt: member.createdAt,
                user: {
                  id: member.user.id,
                  firstName: member.user.firstName,
                  lastName: member.user.lastName,
                  avatarUrl: member.user.avatarUrl,
                },
              })),
            }
          : team),
        userCanManage,
      };
    });

    res.json({ success: true, data: enrichedTeams });
  } catch (error) {
    next(error);
  }
});

// Crear nuevo equipo (registrando al creador con permisos plenos)
router.post('/workspaces/:workspaceId/teams', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const [user, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: currentUserId }, select: { isSuperAdmin: true } }),
      prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: req.params.workspaceId,
            userId: currentUserId,
          },
        },
      }),
    ]);
    if (
      !user?.isSuperAdmin &&
      (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN'))
    ) {
      throw new ForbiddenError('Solo administradores del espacio pueden crear equipos');
    }

    const data = createTeamSchema.parse(req.body);

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          workspaceId: req.params.workspaceId,
          createdById: currentUserId,
          name: data.name,
          description: data.description,
          color: data.color,
        },
      });

      // Crear lista de miembros iniciales asegurando que el creador esté incluido como LEADER con canManage
      const uniqueMemberIds = new Set(data.memberIds || []);
      uniqueMemberIds.add(currentUserId);

      await tx.teamMember.createMany({
        data: Array.from(uniqueMemberIds).map((userId) => ({
          teamId: newTeam.id,
          userId,
          role: userId === currentUserId ? 'LEADER' : 'MEMBER',
          canManage: userId === currentUserId,
        })),
      });

      return newTeam;
    });

    const fullTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: { ...fullTeam, userCanManage: true } });
  } catch (error) {
    next(error);
  }
});

// Modificar datos del equipo (solo quien lo creó o a quien se le dio permiso)
router.patch('/teams/:teamId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const { allowed, team } = await canUserManageTeam(req.params.teamId, currentUserId);
    if (!team) throw new NotFoundError('Equipo no encontrado');
    if (!allowed) {
      throw new ForbiddenError('No tienes permisos para modificar este equipo. Solo el creador o personas con permisos asignados pueden gestionarlo.');
    }

    const data = updateTeamSchema.parse(req.body);

    const updated = await prisma.team.update({
      where: { id: req.params.teamId },
      data,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    res.json({ success: true, data: { ...updated, userCanManage: true } });
  } catch (error) {
    next(error);
  }
});

// Eliminar equipo (solo quien lo creó o Super Admin / Owner)
router.delete('/teams/:teamId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const { allowed, team } = await canUserManageTeam(req.params.teamId, currentUserId);
    if (!team) throw new NotFoundError('Equipo no encontrado');
    if (!allowed) {
      throw new ForbiddenError('No tienes permisos para eliminar este equipo.');
    }

    await prisma.team.delete({
      where: { id: req.params.teamId },
    });

    res.json({ success: true, message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

// Añadir miembro a un equipo (con opción de otorgarle permiso de gestión)
router.post('/teams/:teamId/members', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const { allowed, team } = await canUserManageTeam(req.params.teamId, currentUserId);
    if (!team) throw new NotFoundError('Equipo no encontrado');
    if (!allowed) {
      throw new ForbiddenError('No tienes permisos para agregar miembros a este equipo.');
    }

    const { userId, role = 'MEMBER', canManage = false } = req.body;
    if (!userId) throw new BadRequestError('ID de usuario requerido');

    const member = await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: req.params.teamId, userId } },
      update: {
        role,
        canManage,
      },
      create: {
        teamId: req.params.teamId,
        userId,
        role,
        canManage,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

// Modificar permisos de un miembro (Dar o quitar permiso de gestión al equipo)
router.patch('/teams/:teamId/members/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const { allowed, team } = await canUserManageTeam(req.params.teamId, currentUserId);
    if (!team) throw new NotFoundError('Equipo no encontrado');
    if (!allowed) {
      throw new ForbiddenError('No tienes permisos para modificar privilegios en este equipo.');
    }

    const { role, canManage } = req.body;

    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId: req.params.teamId,
          userId: req.params.userId,
        },
      },
      data: {
        role: role !== undefined ? role : undefined,
        canManage: canManage !== undefined ? canManage : undefined,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, data: member, message: 'Permisos del miembro actualizados' });
  } catch (error) {
    next(error);
  }
});

// Remover miembro de un equipo
router.delete('/teams/:teamId/members/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.userId;
    const { allowed, team } = await canUserManageTeam(req.params.teamId, currentUserId);
    if (!team) throw new NotFoundError('Equipo no encontrado');
    
    // Un usuario siempre puede salirse de un equipo, o un gestor autorizado puede removerlo
    const isSelf = currentUserId === req.params.userId;
    if (!allowed && !isSelf) {
      throw new ForbiddenError('No tienes permisos para remover miembros de este equipo.');
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: req.params.teamId,
          userId: req.params.userId,
        },
      },
    });

    res.json({ success: true, message: 'Miembro removido del equipo' });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// VINCULACIÓN DE MIEMBROS Y EQUIPOS A PROYECTOS
// -------------------------------------------------------------

// Listar miembros de un proyecto (directos y de equipos)
router.get('/projects/:projectId/members', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
        teams: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      return;
    }

    const memberMap = new Map<string, any>();
    project.members.forEach((m) => memberMap.set(m.user.id, { ...m.user, source: 'direct' }));

    project.teams.forEach((pt) => {
      pt.team.members.forEach((tm) => {
        if (!memberMap.has(tm.user.id)) {
          memberMap.set(tm.user.id, { ...tm.user, source: `team:${pt.team.name}` });
        }
      });
    });

    res.json({
      success: true,
      data: {
        members: Array.from(memberMap.values()),
        teams: project.teams.map(({ team }) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          color: team.color,
          members: team.members.map(({ id, userId }) => ({ id, userId })),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Agregar miembro individual al proyecto
router.post('/projects/:projectId/members', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (!userId) throw new BadRequestError('ID de usuario requerido');

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.projectId, userId } },
      update: {},
      create: { projectId: req.params.projectId, userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

// Vincular equipo completo al proyecto (agrega a todos los miembros automáticamente)
router.post('/projects/:projectId/teams', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.body;
    if (!teamId) throw new BadRequestError('ID de equipo requerido');

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new BadRequestError('Equipo no encontrado');

    await prisma.$transaction(async (tx) => {
      await tx.projectTeam.upsert({
        where: { projectId_teamId: { projectId: req.params.projectId, teamId } },
        update: {},
        create: { projectId: req.params.projectId, teamId },
      });

      for (const m of team.members) {
        await tx.projectMember.upsert({
          where: { projectId_userId: { projectId: req.params.projectId, userId: m.userId } },
          update: {},
          create: { projectId: req.params.projectId, userId: m.userId },
        });
      }
    });

    res.status(201).json({ success: true, message: `Equipo ${team.name} vinculado al proyecto con éxito` });
  } catch (error) {
    next(error);
  }
});

// Remover miembro del proyecto
router.delete('/projects/:projectId/members/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: req.params.projectId,
          userId: req.params.userId,
        },
      },
    });

    res.json({ success: true, message: 'Miembro removido del proyecto' });
  } catch (error) {
    next(error);
  }
});

export default router;
