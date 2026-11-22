import { prisma } from '../../config/db.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from './workspaces.schemas.js';
import crypto from 'crypto';

export class WorkspacesService {
  static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      counts: m.workspace._count,
    }));
  }

  static async getById(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenError('No tienes acceso a este espacio de trabajo');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
        projects: {
          where: { isArchived: false },
          include: {
            boards: true,
            _count: { select: { boards: true, members: true } },
          },
        },
      },
    });

    if (!workspace) throw new NotFoundError('Workspace no encontrado');

    return {
      ...workspace,
      userRole: member.role,
    };
  }

  static async create(userId: string, input: CreateWorkspaceInput) {
    const baseSlug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    return prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        logoUrl: input.logoUrl,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  static async update(workspaceId: string, input: UpdateWorkspaceInput) {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: input,
    });
  }

  static async delete(workspaceId: string) {
    return prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  static async listMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async inviteMember(workspaceId: string, invitedById: string, input: InviteMemberInput) {
    const targetEmail = input.email.toLowerCase();

    // Comprobar si ya es miembro
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: targetEmail },
      },
    });
    if (existingMember) {
      throw new BadRequestError('El usuario ya es miembro de este espacio');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Crear o actualizar invitación existente
    const invitation = await prisma.workspaceInvitation.upsert({
      where: {
        id: (
          await prisma.workspaceInvitation.findFirst({
            where: { workspaceId, email: targetEmail, status: 'PENDING' },
          })
        )?.id || 'non-existing-id',
      },
      update: {
        role: input.role,
        token,
        expiresAt,
        status: 'PENDING',
      },
      create: {
        workspaceId,
        email: targetEmail,
        role: input.role,
        token,
        invitedById,
        expiresAt,
      },
    });

    return invitation;
  }

  static async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new BadRequestError('Invitación no válida o ya utilizada');
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestError('La invitación ha expirado');
    }

    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { success: true, workspace: invitation.workspace };
  }

  static async updateMemberRole(workspaceId: string, targetUserId: string, input: UpdateMemberRoleInput) {
    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      data: { role: input.role },
    });
  }

  static async removeMember(workspaceId: string, targetUserId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (workspace?.ownerId === targetUserId) {
      throw new BadRequestError('No se puede remover al propietario del espacio');
    }

    return prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });
  }
}
