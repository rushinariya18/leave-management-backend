import { z } from 'zod';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const leaveBalanceHistoryParamsSchema = z.object({
  leaveTypeId: z.uuid(V.INVALID_LEAVE_TYPE_ID),
});

export type LeaveBalanceHistoryParams = z.infer<typeof leaveBalanceHistoryParamsSchema>;
