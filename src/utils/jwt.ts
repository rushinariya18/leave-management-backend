import jwt, { type SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  tokenVersion: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return secret;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '1d') as SignOptions['expiresIn'];

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
