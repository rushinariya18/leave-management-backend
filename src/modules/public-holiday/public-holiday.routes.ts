import { Router } from 'express';
import { Role } from '../../generated/prisma/client.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import { validateQuery } from '../../middlewares/validateQuery.middleware.js';
import * as publicHolidayController from './public-holiday.controller.js';
import {
  createPublicHolidaySchema,
  holidayIdParamsSchema,
  listPublicHolidaysQuerySchema,
  updatePublicHolidaySchema,
} from './public-holiday.validation.js';

const router = Router();

/**
 * @description List public holidays, optionally filtered by query parameters.
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validateQuery(listPublicHolidaysQuerySchema),
  publicHolidayController.listHolidays,
);

/**
 * @description Create a new public holiday.
 * @access Private (HR)
 */
router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createPublicHolidaySchema),
  publicHolidayController.createHoliday,
);

/**
 * @description Update an existing public holiday.
 * @access Private (HR)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(holidayIdParamsSchema),
  validate(updatePublicHolidaySchema),
  publicHolidayController.updateHoliday,
);

/**
 * @description Delete a public holiday.
 * @access Private (HR)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(holidayIdParamsSchema),
  publicHolidayController.deleteHoliday,
);

export default router;
