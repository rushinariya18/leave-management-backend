import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

const httpLogger = logger.child({ module: 'http' });

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    httpLogger.info('HTTP request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user ? req.user._id.toString() : 'anonymous',
    });
  });

  next();
}
