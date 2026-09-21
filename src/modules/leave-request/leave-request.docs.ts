import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import {
  calendarQuerySchema,
  cancelLeaveRequestSchema,
  createLeaveRequestSchema,
  hrCalendarQuerySchema,
  leaveRequestIdParamsSchema,
  myLeaveRequestsQuerySchema,
  rejectLeaveRequestSchema,
} from './leave-request.validation.js';

const leaveRequestResponseSchema = z.object({
  id: z.uuid(),
  employeeId: z.uuid(),
  leaveTypeId: z.uuid(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  days: z.number(),
  dayPart: z.enum(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF']),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
  note: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  decidedAt: z.iso.datetime().nullable(),
  decidedById: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const calendarEntrySchema = z.object({
  employeeId: z.uuid(),
  employeeName: z.string(),
  date: z.iso.date(),
  dayPart: z.enum(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF']),
  leaveTypeId: z.uuid(),
  leaveTypeName: z.string(),
});

const auditLogEntrySchema = z.object({
  id: z.uuid(),
  requestId: z.uuid(),
  actorId: z.uuid(),
  action: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'AMENDED']),
  reason: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.iso.datetime(),
});

export function registerLeaveRequestDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/leave-requests',
    tags: ['Leave Requests'],
    summary: 'Create a leave request',
    description: 'Requires the EMPLOYEE or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createLeaveRequestSchema } } },
    },
    responses: {
      201: buildSuccessResponse(leaveRequestResponseSchema, 'Leave request created successfully'),
      400: errorResponse('Validation error or insufficient leave balance'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/me',
    tags: ['Leave Requests'],
    summary: 'List the authenticated user\'s own leave requests',
    description: 'Requires the EMPLOYEE or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      query: myLeaveRequestsQuerySchema,
    },
    responses: {
      200: buildSuccessResponse(z.array(leaveRequestResponseSchema), 'List of own leave requests'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/team/pending',
    tags: ['Leave Requests'],
    summary: 'List pending leave requests for the manager\'s team',
    description: 'Requires the MANAGER role.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(
        z.array(leaveRequestResponseSchema),
        'List of pending team leave requests',
      ),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires MANAGER role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/calendar',
    tags: ['Leave Requests'],
    summary: 'Get the team leave calendar for a month',
    description: 'Requires the EMPLOYEE or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      query: calendarQuerySchema,
    },
    responses: {
      200: buildSuccessResponse(z.array(calendarEntrySchema), 'Team leave calendar entries'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/calendar/hr',
    tags: ['Leave Requests'],
    summary: 'Get the organization-wide leave calendar for a month',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      query: hrCalendarQuerySchema,
    },
    responses: {
      200: buildSuccessResponse(z.array(calendarEntrySchema), 'Org-wide leave calendar entries'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/{id}',
    tags: ['Leave Requests'],
    summary: 'Get a single leave request by id',
    description: 'Requires the EMPLOYEE or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveRequestIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(leaveRequestResponseSchema, 'Leave request details'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
      404: errorResponse('Leave request not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/leave-requests/{id}/cancel',
    tags: ['Leave Requests'],
    summary: 'Cancel a leave request',
    description: 'Requires the EMPLOYEE or MANAGER role. Only pending or approved requests can be cancelled.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveRequestIdParamsSchema,
      body: { content: { 'application/json': { schema: cancelLeaveRequestSchema } } },
    },
    responses: {
      200: buildSuccessResponse(leaveRequestResponseSchema, 'Leave request cancelled successfully'),
      400: errorResponse('Request is not cancellable'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
      404: errorResponse('Leave request not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/leave-requests/{id}/approve',
    tags: ['Leave Requests'],
    summary: 'Approve a pending leave request',
    description: 'Requires the MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveRequestIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(leaveRequestResponseSchema, 'Leave request approved successfully'),
      400: errorResponse('Request is not pending'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires MANAGER role, or not this employee\'s manager'),
      404: errorResponse('Leave request not found'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/leave-requests/{id}/reject',
    tags: ['Leave Requests'],
    summary: 'Reject a pending leave request',
    description: 'Requires the MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveRequestIdParamsSchema,
      body: { content: { 'application/json': { schema: rejectLeaveRequestSchema } } },
    },
    responses: {
      200: buildSuccessResponse(leaveRequestResponseSchema, 'Leave request rejected successfully'),
      400: errorResponse('Validation error or request is not pending'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires MANAGER role, or not this employee\'s manager'),
      404: errorResponse('Leave request not found'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-requests/{id}/audit-logs',
    tags: ['Leave Requests'],
    summary: 'Get the audit log history for a leave request',
    description: 'Requires the EMPLOYEE or MANAGER role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveRequestIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(z.array(auditLogEntrySchema), 'Leave request audit logs'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires EMPLOYEE or MANAGER role'),
      404: errorResponse('Leave request not found'),
    },
  });
}
