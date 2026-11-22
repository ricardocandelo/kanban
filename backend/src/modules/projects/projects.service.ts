import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';
import { CreateProjectInput, UpdateProjectInput } from './projects.schemas.js';

export class ProjectsService {
  static async listByWorkspace(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId, isArchived: false },
      include: {
        boards: {
          select: { id: true, name: true, isFavorite: true },
        },
        _count: {
          select: { boards: true, members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boards: {
          where: { isArchived: false },
          include: {
            _count: { select: { columns: true } },
          },
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

    if (!project) throw new NotFoundError('Proyecto no encontrado');
    return project;
  }

  static async create(workspaceId: string, userId: string, input: CreateProjectInput) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: input.name,
          key: input.key,
          description: input.description,
          privacy: input.privacy,
          startDate: input.startDate ? new Date(input.startDate) : null,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'ADMIN',
        },
      });

      // Crear tablero inicial por defecto
      const defaultBoard = await tx.board.create({
        data: {
          projectId: project.id,
          name: 'Tablero Principal',
          description: 'Flujo de trabajo predeterminado',
        },
      });

      // Crear columnas básicas
      const defaultColumns = [
        { name: 'Backlog', color: '#64748B', position: 1000 },
        { name: 'En Progreso', color: '#3B82F6', position: 2000 },
        { name: 'En Revisión', color: '#F59E0B', position: 3000 },
        { name: 'Completado', color: '#10B981', position: 4000, isDone: true },
      ];

      for (const col of defaultColumns) {
        await tx.column.create({
          data: {
            boardId: defaultBoard.id,
            name: col.name,
            color: col.color,
            position: col.position,
            isDone: col.isDone || false,
          },
        });
      }

      return project;
    });
  }

  static async update(projectId: string, input: UpdateProjectInput) {
    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      },
    });
  }

  static async delete(projectId: string) {
    return prisma.project.delete({ where: { id: projectId } });
  }
}
