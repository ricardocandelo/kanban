import { z } from 'zod';
import { ProjectPrivacy } from '@prisma/client';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  privacy: z.nativeEnum(ProjectPrivacy).default(ProjectPrivacy.PUBLIC_IN_WORKSPACE),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  privacy: z.nativeEnum(ProjectPrivacy).optional(),
  isArchived: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
