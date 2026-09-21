import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import {
  assignManagerSchema,
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateStatusSchema,
  userIdParamsSchema,
} from './user.validation.js';

const roleSchema = z.enum(['EMPLOYEE', 'MANAGER', 'HR']);

const userResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: roleSchema,
  managerId: z.uuid().nullable(),
  isActive: z.boolean(),
  joinDate: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const userListResponseSchema = z.array(userResponseSchema);

export function registerUserDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Get the authenticated user\'s profile',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(userResponseSchema, 'Current user profile'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/me',
    tags: ['Users'],
    summary: 'Update the authenticated user\'s profile',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: updateProfileSchema } } },
    },
    responses: {
      200: buildSuccessResponse(userResponseSchema, 'Profile updated successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/me/password',
    tags: ['Users'],
    summary: 'Change the authenticated user\'s password',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: changePasswordSchema } } },
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'Password changed successfully'),
      400: errorResponse('Validation error or incorrect current password'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/users/managers',
    tags: ['Users'],
    summary: 'List users eligible to be assigned as a manager',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(userListResponseSchema, 'List of eligible managers'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/users',
    tags: ['Users'],
    summary: 'List users',
    description: 'Requires the HR or MANAGER role. Supports filtering, sorting, and pagination.',
    security: [{ bearerAuth: [] }],
    request: {
      query: listUsersQuerySchema,
    },
    responses: {
      200: buildSuccessResponse(userListResponseSchema, 'Paginated list of users'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR or MANAGER role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/users/{id}',
    tags: ['Users'],
    summary: 'Get a single user by id',
    description: 'Requires the HR or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(userResponseSchema, 'User details'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR or MANAGER role'),
      404: errorResponse('User not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/users',
    tags: ['Users'],
    summary: 'Create a new user',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createUserSchema } } },
    },
    responses: {
      201: buildSuccessResponse(userResponseSchema, 'User created successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      409: errorResponse('Email is already registered'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/{id}/status',
    tags: ['Users'],
    summary: 'Activate or deactivate a user',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdParamsSchema,
      body: { content: { 'application/json': { schema: updateStatusSchema } } },
    },
    responses: {
      200: buildSuccessResponse(userResponseSchema, 'User status updated successfully'),
      400: errorResponse('Validation error or cannot deactivate own account'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('User not found'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/users/{id}/manager',
    tags: ['Users'],
    summary: 'Assign or change a user\'s manager',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdParamsSchema,
      body: { content: { 'application/json': { schema: assignManagerSchema } } },
    },
    responses: {
      200: buildSuccessResponse(userResponseSchema, 'Manager assigned successfully'),
      400: errorResponse('Validation error or invalid manager'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('User or manager not found'),
    },
  });
}
