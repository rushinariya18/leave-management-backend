import { z } from 'zod';
import { DayPart, RequestStatus } from '../../generated/prisma/client.js';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.uuid(V.INVALID_LEAVE_TYPE_ID),
    startDate: z.iso.date(V.LEAVE_REQUEST_DATE_INVALID),
    endDate: z.iso.date(V.LEAVE_REQUEST_DATE_INVALID),
    dayPart: z.enum(DayPart).default(DayPart.FULL_DAY),
    note: z.string().max(500, V.LEAVE_REQUEST_NOTE_TOO_LONG).optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: V.LEAVE_REQUEST_END_BEFORE_START,
    path: ['endDate'],
  })
  .refine((data) => data.dayPart === DayPart.FULL_DAY || data.startDate === data.endDate, {
    message: V.LEAVE_REQUEST_HALF_DAY_MULTI_DATE,
    path: ['dayPart'],
  });

export const myLeaveRequestsQuerySchema = z.object({
  status: z.enum(RequestStatus).optional(),
  leaveTypeId: z.uuid(V.INVALID_LEAVE_TYPE_ID).optional(),
  startDate: z.iso.date(V.LEAVE_REQUEST_DATE_INVALID).optional(),
  endDate: z.iso.date(V.LEAVE_REQUEST_DATE_INVALID).optional(),
});

export const leaveRequestIdParamsSchema = z.object({
  id: z.uuid(V.INVALID_LEAVE_REQUEST_ID),
});

export const rejectLeaveRequestSchema = z.object({
  reason: z.string().min(3, V.REJECTION_REASON_REQUIRED).max(500, V.LEAVE_REQUEST_NOTE_TOO_LONG),
});

export const cancelLeaveRequestSchema = z.object({
  reason: z.string().max(500, V.LEAVE_REQUEST_NOTE_TOO_LONG).optional(),
});

export const calendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, V.CALENDAR_MONTH_INVALID),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type MyLeaveRequestsQueryInput = z.infer<typeof myLeaveRequestsQuerySchema>;
export type LeaveRequestIdParams = z.infer<typeof leaveRequestIdParamsSchema>;
export type RejectLeaveRequestInput = z.infer<typeof rejectLeaveRequestSchema>;
export type CancelLeaveRequestInput = z.infer<typeof cancelLeaveRequestSchema>;
export type CalendarQueryInput = z.infer<typeof calendarQuerySchema>;
