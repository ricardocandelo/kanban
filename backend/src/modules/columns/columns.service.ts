import { prisma } from '../../config/db.js';
import { calculatePosition } from '../../utils/fractional.js';
import { CreateColumnInput, UpdateColumnInput, ReorderColumnInput } from './columns.schemas.js';

export class ColumnsService {
  static async create(boardId: string, input: CreateColumnInput) {
    const position = calculatePosition(input.prevPos, input.nextPos);
    return prisma.column.create({
      data: {
        boardId,
        name: input.name,
        color: input.color,
        wipLimit: input.wipLimit,
        isDone: input.isDone,
        position,
      },
    });
  }

  static async update(columnId: string, input: UpdateColumnInput) {
    return prisma.column.update({
      where: { id: columnId },
      data: input,
    });
  }

  static async reorder(columnId: string, input: ReorderColumnInput) {
    const position = calculatePosition(input.prevPos, input.nextPos);
    return prisma.column.update({
      where: { id: columnId },
      data: { position },
    });
  }

  static async delete(columnId: string) {
    return prisma.column.delete({
      where: { id: columnId },
    });
  }
}
