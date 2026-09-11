import { z } from 'zod';
import { Role } from '../../generated/prisma/client.js';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const updateProfileSchema = z.object({
  name: z.string().min(2, V.NAME_MIN_LENGTH),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, V.PASSWORD_REQUIRED),
  newPassword: z.string().min(8, V.NEW_PASSWORD_MIN_LENGTH),
});

export const createUserSchema = z.object({
  name: z.string().min(2, V.NAME_MIN_LENGTH),
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
  password: z.string().min(8, V.PASSWORD_MIN_LENGTH),
  role: z.enum(Role),
  managerId: z.uuid(V.INVALID_MANAGER_ID).optional(),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const assignManagerSchema = z.object({
  managerId: z.uuid(V.INVALID_MANAGER_ID).nullable(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.enum(Role).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  managerId: z.uuid(V.INVALID_MANAGER_ID).optional(),
  sortBy: z.enum(['name', 'email', 'role', 'manager', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
