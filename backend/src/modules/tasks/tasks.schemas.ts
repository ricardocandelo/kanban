import { z } from 'zod';
import { TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título de la tarea es obligatorio'),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  prevPos: z.number().optional().nullable(),
  nextPos: z.number().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  isCompleted: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
  targetColumnId: z.string().uuid(),
  prevPos: z.number().optional().nullable(),
  nextPos: z.number().optional().nullable(),
});

export const manageAssigneesSchema = z.object({
  userIds: z.array(z.string().uuid()),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  prevPos: z.number().optional().nullable(),
  nextPos: z.number().optional().nullable(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ManageAssigneesInput = z.infer<typeof manageAssigneesSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
