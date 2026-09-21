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

/**
 * @description List all leave types.
 * @access Private
 */
router.get('/', authenticate, leaveTypeController.listLeaveTypes);

/**
 * @description Get the details of a single leave type by id.
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  validateParams(leaveTypeIdParamsSchema),
  leaveTypeController.getLeaveType,
);

/**
 * @description Create a new leave type.
 * @access Private (HR)
 */
router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createLeaveTypeSchema),
  leaveTypeController.createLeaveType,
);

/**
 * @description Update an existing leave type.
 * @access Private (HR)
 */
router.patch(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(leaveTypeIdParamsSchema),
  validate(updateLeaveTypeSchema),
  leaveTypeController.updateLeaveType,
);

/**
 * @description Delete a leave type.
 * @access Private (HR)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.HR),
  validateParams(leaveTypeIdParamsSchema),
  leaveTypeController.deleteLeaveType,
);

export default router;
