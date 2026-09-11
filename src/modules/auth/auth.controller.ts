import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { SUCCESS_MESSAGES } from '../../constants/messages.js';
import * as authService from './auth.service.js';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.signup(req.body);
  sendSuccess(res, 201, SUCCESS_MESSAGES.SIGNUP_SUCCESS, user);
});

export const signin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signin(req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.SIGNIN_SUCCESS, result);
});

export const signout = asyncHandler(async (req: Request, res: Response) => {
  await authService.signout(String(req.user!.id));
  sendSuccess(res, 200, SUCCESS_MESSAGES.SIGNOUT_SUCCESS);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.OTP_SENT, result);
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resendOtp(req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.OTP_SENT, result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, 200, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
});
