import { z } from 'zod';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const createPublicHolidaySchema = z.object({
  date: z.iso.date(V.HOLIDAY_DATE_INVALID),
  name: z.string().min(2, V.HOLIDAY_NAME_MIN_LENGTH),
});

export const updatePublicHolidaySchema = z
  .object({
    date: z.iso.date(V.HOLIDAY_DATE_INVALID).optional(),
    name: z.string().min(2, V.HOLIDAY_NAME_MIN_LENGTH).optional(),
  })
  .refine((data) => data.date !== undefined || data.name !== undefined, {
    message: 'At least one field must be provided',
  });

export const listPublicHolidaysQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, V.HOLIDAY_YEAR_INVALID).optional(),
});

export const holidayIdParamsSchema = z.object({
  id: z.uuid(V.INVALID_HOLIDAY_ID),
});

export type CreatePublicHolidayInput = z.infer<typeof createPublicHolidaySchema>;
export type UpdatePublicHolidayInput = z.infer<typeof updatePublicHolidaySchema>;
export type ListPublicHolidaysQueryInput = z.infer<typeof listPublicHolidaysQuerySchema>;
export type HolidayIdParams = z.infer<typeof holidayIdParamsSchema>;
