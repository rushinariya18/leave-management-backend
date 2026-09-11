import { rateLimit } from 'express-rate-limit';
import {
  globalRateLimitOptions,
  otpRateLimitOptions,
  resetPasswordRateLimitOptions,
  signinRateLimitOptions,
} from '../config/rateLimit.js';
import { sendError } from '../utils/response.js';

export const globalRateLimiter = rateLimit({
  ...globalRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'Too many requests, please try again later'),
});

export const signinRateLimiter = rateLimit({
  ...signinRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'Too many attempts, please try again later'),
});

export const otpRateLimiter = rateLimit({
  ...otpRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email,
  handler: (_req, res) => sendError(res, 429, 'Too many attempts, please try again later'),
});

export const resetPasswordRateLimiter = rateLimit({
  ...resetPasswordRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'Too many attempts, please try again later'),
});
