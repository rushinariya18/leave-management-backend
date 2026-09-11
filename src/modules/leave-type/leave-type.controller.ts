import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as leaveTypeService from './leave-type.service.js';
import type { LeaveTypeIdParams } from './leave-type.validation.js';

export const createLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const leaveType = await leaveTypeService.createLeaveType(req.body);
  sendSuccess(res, 201, SUCCESS_MESSAGES.LEAVE_TYPE_CREATED_SUCCESS, leaveType);
});

export const updateLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveTypeIdParams;
  const leaveType = await leaveTypeService.updateLeaveType(id, req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_TYPE_UPDATED_SUCCESS, leaveType);
});

export const deleteLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveTypeIdParams;
  await leaveTypeService.deleteLeaveType(id);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_TYPE_DELETED_SUCCESS);
});

export const listLeaveTypes = asyncHandler(async (_, res: Response) => {
  const leaveTypes = await leaveTypeService.listLeaveTypes();
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_TYPES_FETCHED_SUCCESS, leaveTypes);
});

export const getLeaveType = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveTypeIdParams;
  const leaveType = await leaveTypeService.getLeaveTypeById(id);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_TYPE_FETCHED_SUCCESS, leaveType);
});
