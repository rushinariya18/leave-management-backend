import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as leaveBalanceService from './leave-balance.service.js';

export const getMyLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const balances = await leaveBalanceService.getMyLeaveBalances(String(req.user!.id));
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_BALANCES_FETCHED_SUCCESS, balances);
});
