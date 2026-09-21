import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z, type ZodType } from 'zod';

extendZodWithOpenApi(z);

export function buildSuccessResponse(dataSchema: ZodType, description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: z.object({
          success: z.literal(true),
          message: z.string(),
          data: dataSchema,
        }),
      },
    },
  };
}

export function errorResponse(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: z.object({
          success: z.literal(false),
          message: z.union([z.string(), z.record(z.string(), z.string())]),
          data: z.null(),
        }),
      },
    },
  };
}
