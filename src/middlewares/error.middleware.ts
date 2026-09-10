import type { NextFunction, Request, Response } from 'express';
import { createModuleLogger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/response.js';

const errorLogger = createModuleLogger('error-handler');

function errorContext(req: Request) {
  return {
    requestId: req.id,
    userId: req.user?._id.toString() ?? 'anonymous',
    method: req.method,
    url: req.originalUrl,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    errorLogger.warn(err.message, { ...errorContext(req), statusCode: err.statusCode });
    sendError(res, err.statusCode, err.message);
    return;
  }

  if (
    err instanceof SyntaxError &&
    'status' in err &&
    err.status === 400 &&
    'type' in err &&
    err.type === 'entity.parse.failed'
  ) {
    errorLogger.warn('Invalid JSON payload received', errorContext(req));
    sendError(res, 400, 'Invalid JSON payload');
    return;
  }

  errorLogger.error('Unhandled error', {
    ...errorContext(req),
    error: err instanceof Error ? err.stack : String(err),
  });
  sendError(res, 500, 'Internal server error');
}
