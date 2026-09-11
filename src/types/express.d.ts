import type { Role } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        role: Role;
        tokenVersion: number;
      };
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
