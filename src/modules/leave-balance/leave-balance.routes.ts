import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import * as leaveBalanceController from './leave-balance.controller.js';
import { leaveBalanceHistoryParamsSchema } from './leave-balance.validation.js';

const router = Router();

router.get('/me', authenticate, leaveBalanceController.getMyLeaveBalances);

router.get(
  '/me/:leaveTypeId/history',
  authenticate,
  validateParams(leaveBalanceHistoryParamsSchema),
  leaveBalanceController.getLeaveBalanceHistory,
);

export default router;
