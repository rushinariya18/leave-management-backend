import { z } from 'zod';
import { LeavePeriodType } from '../../generated/prisma/client.js';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const createLeaveTypeSchema = z.object({
  name: z.string().min(2, V.LEAVE_TYPE_NAME_MIN_LENGTH),
  description: z.string().optional(),
  deductsBalance: z.boolean().default(true),
  defaultAllowance: z.number().nonnegative(V.LEAVE_TYPE_ALLOWANCE_INVALID),
  requiresApproval: z.boolean().default(true),
  minAdvanceNoticeDays: z.number().int().nonnegative().default(0),
  maxDaysPerRequest: z.number().positive(V.LEAVE_TYPE_MAX_DAYS_INVALID),
  allowsPastDates: z.boolean().default(false),
  periodType: z.enum(LeavePeriodType).default(LeavePeriodType.NONE),
  maxRequestsPerPeriod: z.number().int().positive().optional(),
  allowsCarryForward: z.boolean().default(false),
  maxCarryForwardDays: z.number().nonnegative().optional(),
});

export const updateLeaveTypeSchema = z
  .object({
    name: z.string().min(2, V.LEAVE_TYPE_NAME_MIN_LENGTH).optional(),
    description: z.string().optional(),
    deductsBalance: z.boolean().optional(),
    defaultAllowance: z.number().nonnegative(V.LEAVE_TYPE_ALLOWANCE_INVALID).optional(),
    requiresApproval: z.boolean().optional(),
    minAdvanceNoticeDays: z.number().int().nonnegative().optional(),
    maxDaysPerRequest: z.number().positive(V.LEAVE_TYPE_MAX_DAYS_INVALID).optional(),
    allowsPastDates: z.boolean().optional(),
    periodType: z.enum(LeavePeriodType).optional(),
    maxRequestsPerPeriod: z.number().int().positive().optional(),
    allowsCarryForward: z.boolean().optional(),
    maxCarryForwardDays: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listLeaveTypesQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
});

export const leaveTypeIdParamsSchema = z.object({
  id: z.uuid(V.INVALID_LEAVE_TYPE_ID),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type ListLeaveTypesQueryInput = z.infer<typeof listLeaveTypesQuerySchema>;
export type LeaveTypeIdParams = z.infer<typeof leaveTypeIdParamsSchema>;
