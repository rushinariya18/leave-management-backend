import { z } from 'zod';
import { VALIDATION_MESSAGES as V } from '../../constants/messages.js';

export const signupSchema = z.object({
  name: z.string().min(2, V.NAME_MIN_LENGTH),
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
  password: z.string().min(8, V.PASSWORD_MIN_LENGTH),
});

export const signinSchema = z.object({
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
  password: z.string().min(1, V.PASSWORD_REQUIRED),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
});

export const resendOtpSchema = z.object({
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
});

export const resetPasswordSchema = z.object({
  email: z.string().min(1, V.EMAIL_REQUIRED).email(V.EMAIL_INVALID),
  otp: z.string().regex(/^\d{6}$/, V.OTP_INVALID_FORMAT),
  newPassword: z.string().min(8, V.NEW_PASSWORD_MIN_LENGTH),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
