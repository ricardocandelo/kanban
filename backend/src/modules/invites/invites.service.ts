import { prisma } from '../../config/db.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors.js';

export class InvitesService {
  /** Crear o regenerar enlace de invitación para un proyecto */
  static async createLink(projectId: string, userId: string, role: 'VIEWER' | 'MEMBER' | 'ADMIN', expiresInDays?: number) {
    // Verificar que el usuario es miembro del proyecto
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenError('No tienes acceso a este proyecto');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Desactivar enlaces anteriores del mismo rol
    await prisma.projectInviteLink.updateMany({
      where: { projectId, role, isActive: true },
      data: { isActive: false },
    });

    const link = await prisma.projectInviteLink.create({
      data: {
        projectId,
        createdById: userId,
        role,
        expiresAt,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
      },
    });

    return link;
  }

  /** Listar enlaces activos de un proyecto */
  static async listLinks(projectId: string, userId: string) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenError('No tienes acceso a este proyecto');

    return prisma.projectInviteLink.findMany({
      where: { projectId, isActive: true },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Validar token (público — sin auth) */
  static async validateToken(token: string) {
    const invite = await prisma.projectInviteLink.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            workspace: { select: { id: true, name: true, logoUrl: true } },
          },
        },
        createdBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    if (!invite) throw new NotFoundError('El enlace de invitación no existe o ya no es válido');
    if (!invite.isActive) throw new BadRequestError('Este enlace de invitación ha sido desactivado');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestError('Este enlace de invitación ha expirado');
    }

    return invite;
  }

  /** Aceptar invitación (requiere auth) */
  static async acceptInvite(token: string, userId: string) {
    const invite = await InvitesService.validateToken(token);

    // Verificar si ya es miembro del proyecto
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: invite.projectId, userId } },
    });
    if (existing) {
      if (existing.role !== invite.role) {
        await prisma.projectMember.update({
          where: { id: existing.id },
          data: { role: invite.role },
        });
      }
      return { alreadyMember: true, project: invite.project };
    }

    // Añadir al workspace si aún no pertenece
    const wsExisting = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.project.workspace.id,
          userId,
        },
      },
    });
    if (!wsExisting) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: invite.project.workspace.id,
          userId,
          role: 'MEMBER',
        },
      });
    }

    // Añadir al proyecto
    await prisma.projectMember.create({
      data: { projectId: invite.projectId, userId, role: invite.role },
    });

    return { alreadyMember: false, project: invite.project };
  }

  /** Revocar enlace */
  static async revokeLink(linkId: string, userId: string) {
    const link = await prisma.projectInviteLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundError('Enlace no encontrado');

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: link.projectId, userId } },
    });
    if (!membership) throw new ForbiddenError('No tienes permiso para revocar este enlace');

    return prisma.projectInviteLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });
  }
}
