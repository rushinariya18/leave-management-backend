import type { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string | Record<string, string>;
  data: T | null;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
): void {
  const body: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string | Record<string, string>,
): void {
  const body: ApiResponse<null> = { success: false, message: message, data: null };
  res.status(statusCode).json(body);
}
