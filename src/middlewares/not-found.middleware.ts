import type { Request, Response } from 'express';
import { createModuleLogger } from '../config/logger.js';
import { sendError } from '../utils/response.js';

const notFoundLogger = createModuleLogger('not-found-handler');

export function notFound(req: Request, res: Response) {
  const message = `API endpoint not found: ${req.method} ${req.originalUrl}`;
  notFoundLogger.warn(message, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode: 404,
  });
  sendError(res, 404, message);
}
