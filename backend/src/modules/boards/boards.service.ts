import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';
import { CreateBoardInput, UpdateBoardInput } from './boards.schemas.js';

export class BoardsService {
  static async listByProject(projectId: string) {
    return prisma.board.findMany({
      where: { projectId, isArchived: false },
      include: {
        _count: {
          select: { columns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(boardId: string) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            workspaceId: true,
            workspace: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                  },
                },
                labels: {
                  include: { label: true },
                },
                subtasks: {
                  select: { id: true, isCompleted: true },
                },
                _count: {
                  select: { comments: true, attachments: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) throw new NotFoundError('Tablero no encontrado');
    return board;
  }

  static async create(projectId: string, input: CreateBoardInput) {
    return prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          projectId,
          name: input.name,
          description: input.description,
        },
      });

      const defaultCols = [
        { name: 'Por Hacer', color: '#64748B', position: 1000 },
        { name: 'En Progreso', color: '#3B82F6', position: 2000 },
        { name: 'En Revisión', color: '#F59E0B', position: 3000 },
        { name: 'Finalizado', color: '#10B981', position: 4000, isDone: true },
      ];

      for (const col of defaultCols) {
        await tx.column.create({
          data: {
            boardId: board.id,
            name: col.name,
            color: col.color,
            position: col.position,
            isDone: col.isDone || false,
          },
        });
      }

      return board;
    });
  }

  static async update(boardId: string, input: UpdateBoardInput) {
    return prisma.board.update({
      where: { id: boardId },
      data: input,
    });
  }

  static async delete(boardId: string) {
    return prisma.board.delete({ where: { id: boardId } });
  }
}
