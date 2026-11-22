import { prisma } from '../../config/db.js';
import { NotFoundError } from '../../utils/errors.js';
import { calculatePosition } from '../../utils/fractional.js';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from './tasks.schemas.js';

export class TasksService {
  static async getById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: {
          select: { id: true, name: true, color: true, boardId: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
            },
          },
        },
        labels: {
          include: { label: true },
        },
        subtasks: {
          orderBy: { position: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        activity: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!task) throw new NotFoundError('Tarea no encontrada');
    return task;
  }

  static async create(columnId: string, createdById: string, input: CreateTaskInput) {
    const position = calculatePosition(input.prevPos, input.nextPos);

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          columnId,
          createdById,
          title: input.title,
          description: input.description,
          priority: input.priority,
          position,
          startDate: input.startDate ? new Date(input.startDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });

      if (input.assigneeIds && input.assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: input.assigneeIds.map((userId) => ({
            taskId: task.id,
            userId,
          })),
        });
      }

      if (input.labelIds && input.labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: input.labelIds.map((labelId) => ({
            taskId: task.id,
            labelId,
          })),
        });
      }

      // Registro de actividad
      const col = await tx.column.findUnique({
        where: { id: columnId },
        include: { board: { include: { project: true } } },
      });

      if (col) {
        await tx.activityLog.create({
          data: {
            workspaceId: col.board.project.workspaceId,
            projectId: col.board.projectId,
            taskId: task.id,
            userId: createdById,
            action: 'TASK_CREATED',
            details: { title: task.title, column: col.name },
          },
        });
      }

      return task;
    });
  }

  static async update(taskId: string, userId: string, input: UpdateTaskInput) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: {
        column: {
          include: { board: { include: { project: true } } },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: task.column.board.project.workspaceId,
        projectId: task.column.board.projectId,
        taskId: task.id,
        userId,
        action: 'TASK_UPDATED',
        details: input as any,
      },
    });

    return task;
  }

  static async move(taskId: string, userId: string, input: MoveTaskInput) {
    const position = calculatePosition(input.prevPos, input.nextPos);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: input.targetColumnId,
        position,
      },
      include: {
        column: {
          include: { board: { include: { project: true } } },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: task.column.board.project.workspaceId,
        projectId: task.column.board.projectId,
        taskId: task.id,
        userId,
        action: 'TASK_MOVED',
        details: { targetColumnId: input.targetColumnId, position },
      },
    });

    return task;
  }

  static async setAssignees(taskId: string, userIds: string[]) {
    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { taskId } }),
      prisma.taskAssignee.createMany({
        data: userIds.map((userId) => ({ taskId, userId })),
      }),
    ]);

    return prisma.taskAssignee.findMany({
      where: { taskId },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  static async createSubtask(taskId: string, input: CreateSubtaskInput) {
    const position = calculatePosition(input.prevPos, input.nextPos);
    return prisma.subtask.create({
      data: {
        taskId,
        title: input.title,
        position,
      },
    });
  }

  static async updateSubtask(subtaskId: string, input: UpdateSubtaskInput) {
    return prisma.subtask.update({
      where: { id: subtaskId },
      data: input,
    });
  }

  static async deleteSubtask(subtaskId: string) {
    return prisma.subtask.delete({ where: { id: subtaskId } });
  }

  static async delete(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  }
}
