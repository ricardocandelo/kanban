import { z } from 'zod';
import { WorkspaceRole } from '@prisma/client';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

export const deleteWorkspaceSchema = z.object({
  confirmationName: z.string().min(1, 'Confirma el nombre del espacio de trabajo'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
