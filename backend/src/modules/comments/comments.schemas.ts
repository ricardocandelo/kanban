import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
