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

router.get(
  '/',
  authenticate,
  validateQuery(listPublicHolidaysQuerySchema),
  publicHolidayController.listHolidays,
);

router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createPublicHolidaySchema),
  publicHolidayController.createHoliday,
);

router.patch(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(holidayIdParamsSchema),
  validate(updatePublicHolidaySchema),
  publicHolidayController.updateHoliday,
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(holidayIdParamsSchema),
  publicHolidayController.deleteHoliday,
);

export default router;
