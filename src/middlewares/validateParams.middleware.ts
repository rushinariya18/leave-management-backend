import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validateParams<T extends Record<string, unknown>>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params ?? {});

    if (!result.success) {
      const message = result.error.issues
        .map((issue) =>
          issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        )
        .join('; ');
      next(new ApiError(400, message));
      return;
    }

    req.validatedParams = result.data;
    next();
  };
}
