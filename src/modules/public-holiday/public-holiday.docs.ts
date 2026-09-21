import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import {
  createPublicHolidaySchema,
  holidayIdParamsSchema,
  listPublicHolidaysQuerySchema,
  updatePublicHolidaySchema,
} from './public-holiday.validation.js';

const publicHolidayResponseSchema = z.object({
  id: z.uuid(),
  date: z.iso.date(),
  name: z.string(),
  year: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function registerPublicHolidayDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/public-holidays',
    tags: ['Public Holidays'],
    summary: 'List public holidays',
    description: 'Optionally filter by year.',
    security: [{ bearerAuth: [] }],
    request: {
      query: listPublicHolidaysQuerySchema,
    },
    responses: {
      200: buildSuccessResponse(z.array(publicHolidayResponseSchema), 'List of public holidays'),
      401: errorResponse('Authentication required'),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/public-holidays',
    tags: ['Public Holidays'],
    summary: 'Create a public holiday',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createPublicHolidaySchema } } },
    },
    responses: {
      201: buildSuccessResponse(publicHolidayResponseSchema, 'Public holiday created successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      409: errorResponse('A public holiday already exists on this date'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/public-holidays/{id}',
    tags: ['Public Holidays'],
    summary: 'Update a public holiday',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: holidayIdParamsSchema,
      body: { content: { 'application/json': { schema: updatePublicHolidaySchema } } },
    },
    responses: {
      200: buildSuccessResponse(publicHolidayResponseSchema, 'Public holiday updated successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('Public holiday not found'),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/public-holidays/{id}',
    tags: ['Public Holidays'],
    summary: 'Delete a public holiday',
    description: 'Requires the HR role.',
    security: [{ bearerAuth: [] }],
    request: {
      params: holidayIdParamsSchema,
    },
    responses: {
      200: buildSuccessResponse(z.null(), 'Public holiday deleted successfully'),
      401: errorResponse('Authentication required'),
      403: errorResponse('Requires HR role'),
      404: errorResponse('Public holiday not found'),
    },
  });
}
