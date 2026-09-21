import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import {
  forgotPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signinSchema,
} from './auth.validation.js';

const signinResponseSchema = z.object({
  token: z.string().openapi({ description: 'JWT bearer token' }),
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: z.enum(['EMPLOYEE', 'MANAGER', 'HR']),
  }),
});

export function registerAuthDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/auth/signin',
    tags: ['Auth'],
    summary: 'Sign in with email and password',
    description: 'Authenticates a user and returns a JWT bearer token to use for subsequent requests.',
    request: {
      body: { content: { 'application/json': { schema: signinSchema } } },
    },
    responses: {
      200: buildSuccessResponse(signinResponseSchema, 'Signed in successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Invalid credentials or inactive account'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/signout',
    tags: ['Auth'],
    summary: 'Sign out the current session',
    description: 'Invalidates the caller\'s session by bumping their token version.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(z.null(), 'Signed out successfully'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/forgot-password',
    tags: ['Auth'],
    summary: 'Request a password reset OTP',
    description: 'Sends a one-time password to the user\'s registered email for password reset.',
    request: {
      body: { content: { 'application/json': { schema: forgotPasswordSchema } } },
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'OTP sent successfully'),
      400: errorResponse('Validation error'),
      404: errorResponse('User not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/resend-otp',
    tags: ['Auth'],
    summary: 'Resend the password reset OTP',
    request: {
      body: { content: { 'application/json': { schema: resendOtpSchema } } },
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'OTP resent successfully'),
      400: errorResponse('Validation error'),
      404: errorResponse('User not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/reset-password',
    tags: ['Auth'],
    summary: 'Reset password using a verified OTP',
    request: {
      body: { content: { 'application/json': { schema: resetPasswordSchema } } },
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'Password reset successfully'),
      400: errorResponse('Validation error or invalid/expired OTP'),
      404: errorResponse('User not found'),
    },
  });
}
