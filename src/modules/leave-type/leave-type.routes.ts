import { Router } from 'express';
import { Role } from '../../generated/prisma/client.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import * as leaveTypeController from './leave-type.controller.js';
import {
  createLeaveTypeSchema,
  leaveTypeIdParamsSchema,
  updateLeaveTypeSchema,
} from './leave-type.validation.js';

const router = Router();

router.get('/', authenticate, leaveTypeController.listLeaveTypes);

router.get(
  '/:id',
  authenticate,
  validateParams(leaveTypeIdParamsSchema),
  leaveTypeController.getLeaveType,
);

router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createLeaveTypeSchema),
  leaveTypeController.createLeaveType,
);

router.patch(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(leaveTypeIdParamsSchema),
  validate(updateLeaveTypeSchema),
  leaveTypeController.updateLeaveType,
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(leaveTypeIdParamsSchema),
  leaveTypeController.deleteLeaveType,
);

export default router;
