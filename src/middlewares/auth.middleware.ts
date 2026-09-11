import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new ApiError(401, 'Authorization header is missing');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authorization header must be in the format: Bearer <token>');
  }

  let payload;

  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, tokenVersion: true, isActive: true },
  });

  if (!user) {
    throw new ApiError(401, 'User belonging to this token no longer exists');
  }

  if (!user.isActive) {
    throw new ApiError(401, 'Account is inactive');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new ApiError(401, 'Token is no longer valid. Please sign in again');
  }

  req.user = { id: user.id, role: user.role, tokenVersion: user.tokenVersion };
  next();
});
