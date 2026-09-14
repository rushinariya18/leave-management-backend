import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as leaveRequestService from './leave-request.service.js';
import type {
  CalendarQueryInput,
  CreateLeaveRequestInput,
  LeaveRequestIdParams,
  MyLeaveRequestsQueryInput,
} from './leave-request.validation.js';

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateLeaveRequestInput;
  const result = await leaveRequestService.createLeaveRequest(req.user!.id, body);
  sendSuccess(res, 201, SUCCESS_MESSAGES.LEAVE_REQUEST_CREATED_SUCCESS, result);
});

export const listMyLeaveRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as MyLeaveRequestsQueryInput;
  const result = await leaveRequestService.listMyLeaveRequests(req.user!.id, query);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUESTS_FETCHED_SUCCESS, result);
});

export const listTeamPendingRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await leaveRequestService.listTeamPendingRequests(req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUESTS_FETCHED_SUCCESS, result);
});

export const getTeamCalendar = asyncHandler(async (req: Request, res: Response) => {
  const { month } = req.validatedQuery as unknown as CalendarQueryInput;
  const result = await leaveRequestService.getTeamCalendar(req.user!, month);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_CALENDAR_FETCHED_SUCCESS, result);
});

export const getLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveRequestIdParams;
  const result = await leaveRequestService.getLeaveRequestById(id, req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUEST_FETCHED_SUCCESS, result);
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveRequestIdParams;
  const result = await leaveRequestService.cancelLeaveRequest(id, req.user!, req.body?.reason);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUEST_CANCELLED_SUCCESS, result);
});

export const approveLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveRequestIdParams;
  const result = await leaveRequestService.approveLeaveRequest(id, req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUEST_APPROVED_SUCCESS, result);
});

export const rejectLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveRequestIdParams;
  const result = await leaveRequestService.rejectLeaveRequest(id, req.user!, req.body.reason);
  sendSuccess(res, 200, SUCCESS_MESSAGES.LEAVE_REQUEST_REJECTED_SUCCESS, result);
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as LeaveRequestIdParams;
  const result = await leaveRequestService.getAuditLogsForRequest(id, req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.AUDIT_LOGS_FETCHED_SUCCESS, result);
});
