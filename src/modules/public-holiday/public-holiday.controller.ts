import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as publicHolidayService from './public-holiday.service.js';
import type { HolidayIdParams, ListPublicHolidaysQueryInput } from './public-holiday.validation.js';

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const holiday = await publicHolidayService.createHoliday(req.body);
  sendSuccess(res, 201, SUCCESS_MESSAGES.HOLIDAY_CREATED_SUCCESS, holiday);
});

export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as HolidayIdParams;
  const holiday = await publicHolidayService.updateHoliday(id, req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.HOLIDAY_UPDATED_SUCCESS, holiday);
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as HolidayIdParams;
  await publicHolidayService.deleteHoliday(id);
  sendSuccess(res, 200, SUCCESS_MESSAGES.HOLIDAY_DELETED_SUCCESS);
});

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const holidays = await publicHolidayService.listHolidays(
    req.validatedQuery as ListPublicHolidaysQueryInput,
  );
  sendSuccess(res, 200, SUCCESS_MESSAGES.HOLIDAYS_FETCHED_SUCCESS, holidays);
});
