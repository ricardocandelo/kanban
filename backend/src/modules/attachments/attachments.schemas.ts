import { z } from 'zod';

export const signUploadSchema = z.object({
  folder: z.string().default('flowboard'),
});

export const saveAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  publicId: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  format: z.string(),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;
export type SaveAttachmentInput = z.infer<typeof saveAttachmentSchema>;
