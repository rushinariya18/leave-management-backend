import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as userService from './user.service.js';
import type { ListUsersQueryInput, UserIdParams } from './user.validation.js';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getMe(String(req.user!.id));
  sendSuccess(res, 200, SUCCESS_MESSAGES.PROFILE_FETCHED_SUCCESS, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(String(req.user!.id), req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.PROFILE_UPDATED_SUCCESS, user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.changePassword(String(req.user!.id), req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.PASSWORD_CHANGED_SUCCESS);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, 201, SUCCESS_MESSAGES.USER_CREATED_SUCCESS, user);
});

export const setUserActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.setUserActive(
    req.params.id as string,
    req.body.isActive,
    String(req.user!.id),
  );
  sendSuccess(res, 200, SUCCESS_MESSAGES.USER_STATUS_UPDATED_SUCCESS, user);
});

export const assignManager = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.assignManager(req.params.id as string, req.body.managerId);
  sendSuccess(res, 200, SUCCESS_MESSAGES.MANAGER_ASSIGNED_SUCCESS, user);
});

export const listManagers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listManagers(req.query);
  sendSuccess(res, 200, SUCCESS_MESSAGES.MANAGERS_FETCHED_SUCCESS, result);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req.validatedQuery as ListUsersQueryInput, req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.USERS_FETCHED_SUCCESS, result);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as unknown as UserIdParams;
  const user = await userService.getUserById(id, req.user!);
  sendSuccess(res, 200, SUCCESS_MESSAGES.USER_FETCHED_SUCCESS, user);
});
