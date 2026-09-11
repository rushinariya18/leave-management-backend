import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../generated/prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
}
