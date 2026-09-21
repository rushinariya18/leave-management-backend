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

/**
 * @description Register a new user account. (Currently disabled)
 * @access Public
 */
// router.post('/signup', signinRateLimiter, validate(signupSchema), authController.signup);

/**
 * @description Authenticate a user with email and password, returning a session token.
 * @access Public
 */
router.post('/signin', signinRateLimiter, validate(signinSchema), authController.signin);

/**
 * @description Sign out the authenticated user and invalidate their session.
 * @access Private
 */
router.post('/signout', authenticate, authController.signout);

/**
 * @description Request a password reset OTP to be sent to the user's registered email.
 * @access Public
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  otpRateLimiter,
  authController.forgotPassword,
);

/**
 * @description Resend the OTP for password reset verification.
 * @access Public
 */
router.post('/resend-otp', validate(resendOtpSchema), otpRateLimiter, authController.resendOtp);

/**
 * @description Reset the user's password using a verified OTP.
 * @access Public
 */
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
