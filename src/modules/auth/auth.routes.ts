import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as authController from './auth.controller.js';
import {
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from './auth.validation.js';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);
router.post('/signin', authRateLimiter, validate(signinSchema), authController.signin);
router.post('/signout', authRateLimiter, authenticate, authController.signout);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post('/resend-otp', authRateLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
