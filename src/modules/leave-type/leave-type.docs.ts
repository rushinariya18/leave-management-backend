import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import {
  createLeaveTypeSchema,
  leaveTypeIdParamsSchema,
  updateLeaveTypeSchema,
} from './leave-type.validation.js';

const leaveTypeResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  deductsBalance: z.boolean(),
  defaultAllowance: z.number(),
  requiresApproval: z.boolean(),
  minAdvanceNoticeDays: z.number(),
  maxDaysPerRequest: z.number(),
  allowsPastDates: z.boolean(),
  periodType: z.enum(['NONE', 'HALF_YEAR']),
  maxRequestsPerPeriod: z.number().nullable(),
  allowsCarryForward: z.boolean(),
  maxCarryForwardDays: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function registerLeaveTypeDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/leave-types',
    tags: ['Leave Types'],
    summary: 'List all leave types',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(z.array(leaveTypeResponseSchema), 'List of leave types'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-types/{id}',
    tags: ['Leave Types'],
    summary: 'Get a single leave type by id',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveTypeIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(leaveTypeResponseSchema, 'Leave type details'),
      401: errorResponse('Authentication required'),
      404: errorResponse('Leave type not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/leave-types',
    tags: ['Leave Types'],
    summary: 'Create a leave type',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createLeaveTypeSchema } } },
    },
    responses: {
      201: buildSuccessResponse(leaveTypeResponseSchema, 'Leave type created successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      409: errorResponse('A leave type with this name already exists'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/leave-types/{id}',
    tags: ['Leave Types'],
    summary: 'Update a leave type',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveTypeIdParamsSchema,
      body: { content: { 'application/json': { schema: updateLeaveTypeSchema } } },
    },
    responses: {
      200: buildSuccessResponse(leaveTypeResponseSchema, 'Leave type updated successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('Leave type not found'),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/leave-types/{id}',
    tags: ['Leave Types'],
    summary: 'Delete a leave type',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveTypeIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'Leave type deleted successfully'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('Leave type not found'),
    },
  });
}
