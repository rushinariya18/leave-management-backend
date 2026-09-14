import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as leaveBalanceController from './leave-balance.controller.js';

const router = Router();

router.get('/me', authenticate, leaveBalanceController.getMyLeaveBalances);

export default router;
