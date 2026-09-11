import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  otpRateLimiter,
  resetPasswordRateLimiter,
  signinRateLimiter,
} from '../../middlewares/rate-limit.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as authController from './auth.controller.js';
import {
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signinSchema,
  // signupSchema,
} from './auth.validation.js';

const router = Router();

// router.post('/signup', signinRateLimiter, validate(signupSchema), authController.signup);
router.post('/signin', signinRateLimiter, validate(signinSchema), authController.signin);
router.post('/signout', authenticate, authController.signout);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  otpRateLimiter,
  authController.forgotPassword,
);
router.post('/resend-otp', validate(resendOtpSchema), otpRateLimiter, authController.resendOtp);
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
