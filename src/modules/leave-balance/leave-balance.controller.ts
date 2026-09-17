import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as leaveBalanceService from './leave-balance.service.js';
import type { LeaveBalanceHistoryParams } from './leave-balance.validation.js';

export const getMyLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const balances = await leaveBalanceService.getMyLeaveBalances(String(req.user!.id));
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_BALANCES_FETCHED_SUCCESS, balances);
});

export const getLeaveBalanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const { leaveTypeId } = req.validatedParams as unknown as LeaveBalanceHistoryParams;
  const result = await leaveBalanceService.getLeaveBalanceHistory(String(req.user!.id), leaveTypeId);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_BALANCE_HISTORY_FETCHED_SUCCESS, result);
});
