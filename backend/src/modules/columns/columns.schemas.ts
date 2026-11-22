import { z } from 'zod';

export const createColumnSchema = z.object({
  name: z.string().min(1, 'El nombre de la columna es obligatorio'),
  color: z.string().default('#64748B'),
  wipLimit: z.number().int().positive().nullable().optional(),
  isDone: z.boolean().default(false),
  prevPos: z.number().optional().nullable(),
  nextPos: z.number().optional().nullable(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  wipLimit: z.number().int().positive().nullable().optional(),
  isDone: z.boolean().optional(),
  position: z.number().optional(),
});

export const reorderColumnSchema = z.object({
  prevPos: z.number().optional().nullable(),
  nextPos: z.number().optional().nullable(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type ReorderColumnInput = z.infer<typeof reorderColumnSchema>;
