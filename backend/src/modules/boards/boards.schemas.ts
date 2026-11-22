import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
