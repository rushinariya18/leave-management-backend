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

/**
 * @description Create a new leave request for the authenticated employee.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.post(
  '/',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validate(createLeaveRequestSchema),
  leaveRequestController.createLeaveRequest,
);

/**
 * @description List the authenticated user's own leave requests.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.get(
  '/me',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateQuery(myLeaveRequestsQuerySchema),
  leaveRequestController.listMyLeaveRequests,
);

/**
 * @description List pending leave requests awaiting the manager's approval for their team.
 * @access Private (MANAGER)
 */
router.get(
  '/team/pending',
  authenticate,
  authorize(Role.MANAGER),
  leaveRequestController.listTeamPendingRequests,
);

/**
 * @description Get the team's leave calendar for a given period.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.get(
  '/calendar',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateQuery(calendarQuerySchema),
  leaveRequestController.getTeamCalendar,
);

/**
 * @description Get the organization-wide leave calendar for HR.
 * @access Private (HR)
 */
router.get(
  '/calendar/hr',
  authenticate,
  authorize(Role.HR),
  validateQuery(hrCalendarQuerySchema),
  leaveRequestController.getHrCalendar,
);

/**
 * @description Get the details of a single leave request by id.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.get(
  '/:id',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.getLeaveRequest,
);

/**
 * @description Cancel an existing leave request.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  validate(cancelLeaveRequestSchema),
  leaveRequestController.cancelLeaveRequest,
);

/**
 * @description Approve a pending leave request for a direct report.
 * @access Private (MANAGER)
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize(Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.approveLeaveRequest,
);

/**
 * @description Reject a pending leave request for a direct report.
 * @access Private (MANAGER)
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize(Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  validate(rejectLeaveRequestSchema),
  leaveRequestController.rejectLeaveRequest,
);

/**
 * @description Get the audit log history for a leave request.
 * @access Private (EMPLOYEE, MANAGER)
 */
router.get(
  '/:id/audit-logs',
  authenticate,
  authorize(Role.EMPLOYEE, Role.MANAGER),
  validateParams(leaveRequestIdParamsSchema),
  leaveRequestController.getAuditLogs,
);

export default router;
