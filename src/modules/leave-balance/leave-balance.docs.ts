import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import { leaveBalanceHistoryParamsSchema } from './leave-balance.validation.js';

const leaveBalanceResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  leaveTypeId: z.uuid(),
  year: z.number(),
  allocated: z.number(),
  remaining: z.number(),
  carriedForward: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const leaveBalanceHistoryEntrySchema = z.object({
  id: z.uuid(),
  requestId: z.uuid(),
  action: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'AMENDED']),
  reason: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export function registerLeaveBalanceDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/leave-balances/me',
    tags: ['Leave Balances'],
    summary: 'Get the authenticated user\'s current leave balances',
    description: 'Returns the current-year balance for every leave type.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: buildSuccessResponse(z.array(leaveBalanceResponseSchema), 'Current leave balances'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/leave-balances/me/{leaveTypeId}/history',
    tags: ['Leave Balances'],
    summary: 'Get balance change history for a leave type',
    description: 'Returns the audit trail of leave requests that affected the balance for the given leave type.',
    security: [{ bearerAuth: [] }],
    request: {
      params: leaveBalanceHistoryParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(
        z.array(leaveBalanceHistoryEntrySchema),
        'Leave balance history',
      ),
      401: errorResponse('Authentication required'),
      404: errorResponse('Leave type not found'),
    },
  });
}
