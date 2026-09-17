import { Router } from 'express';
import { Role } from '../../generated/prisma/client.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import { validateQuery } from '../../middlewares/validateQuery.middleware.js';
import * as leaveRequestController from './leave-request.controller.js';
import {
  calendarQuerySchema,
  cancelLeaveRequestSchema,
  createLeaveRequestSchema,
  hrCalendarQuerySchema,
  leaveRequestIdParamsSchema,
  myLeaveRequestsQuerySchema,
  rejectLeaveRequestSchema,
} from './leave-request.validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validate(createLeaveRequestSchema),
  leaveRequestController.createLeaveRequest,
);

router.get(
  '/me',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateQuery(myLeaveRequestsQuerySchema),
  leaveRequestController.listMyLeaveRequests,
);

router.get(
  '/team/pending',
  authenticate,
  authorize(Role.MANAGER),
  leaveRequestController.listTeamPendingRequests,
);

router.get(
  '/calendar',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateQuery(calendarQuerySchema),
  leaveRequestController.getTeamCalendar,
);

router.get(
  '/calendar/hr',
  authenticate,
  authorize(Role.HR),
  validateQuery(hrCalendarQuerySchema),
  leaveRequestController.getHrCalendar,
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.getLeaveRequest,
);

router.post(
  '/:id/cancel',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  validate(cancelLeaveRequestSchema),
  leaveRequestController.cancelLeaveRequest,
);

router.post(
  '/:id/approve',
  authenticate,
  authorize(Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.approveLeaveRequest,
);

router.post(
  '/:id/reject',
  authenticate,
  authorize(Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  validate(rejectLeaveRequestSchema),
  leaveRequestController.rejectLeaveRequest,
);

router.get(
  '/:id/audit-logs',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.getAuditLogs,
);

export default router;
