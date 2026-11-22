import { prisma } from '../../config/db.js';
import { CreateCommentInput } from './comments.schemas.js';

export class CommentsService {
  static async create(taskId: string, userId: string, input: CreateCommentInput) {
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content: input.content,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Detectar menciones @nombre o @email
    const mentions = input.content.match(/@(\w+)/g);
    if (mentions) {
      // Notificar a los mencionados si corresponden
    }

    return comment;
  }

  static async delete(commentId: string, userId: string) {
    return prisma.comment.delete({
      where: { id: commentId, userId },
    });
  }
}
