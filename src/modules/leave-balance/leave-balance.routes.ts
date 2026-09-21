import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import * as leaveBalanceController from './leave-balance.controller.js';
import { leaveBalanceHistoryParamsSchema } from './leave-balance.validation.js';

const router = Router();

/**
 * @description Get the authenticated user's current leave balances across all leave types.
 * @access Private
 */
router.get('/me', authenticate, leaveBalanceController.getMyLeaveBalances);

/**
 * @description Get the authenticated user's leave balance change history for a specific leave type.
 * @access Private
 */
router.get(
  '/me/:leaveTypeId/history',
  authenticate,
  validateParams(leaveBalanceHistoryParamsSchema),
  leaveBalanceController.getLeaveBalanceHistory,
);

export default router;
