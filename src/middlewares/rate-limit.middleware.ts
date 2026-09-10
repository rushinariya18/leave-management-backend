import { rateLimit } from 'express-rate-limit';
import { authRateLimitOptions, globalRateLimitOptions } from '../config/rateLimit.js';
import { sendError } from '../utils/response.js';

export const globalRateLimiter = rateLimit({
  ...globalRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'Too many requests, please try again later'),
});

export const authRateLimiter = rateLimit({
  ...authRateLimitOptions,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, 429, 'Too many attempts, please try again later'),
});
