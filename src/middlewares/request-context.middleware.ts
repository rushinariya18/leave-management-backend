import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(req: Request, _res: Response, next: NextFunction) {
  req.id = req.headers['x-request-id']?.toString() ?? randomUUID();
  next();
}
