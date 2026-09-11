import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { signToken } from '../../utils/jwt.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import type {
  ForgotPasswordInput,
  ResendOtpInput,
  ResetPasswordInput,
  SigninInput,
  SignupInput,
} from './auth.validation.js';

function getSaltRounds(): number {
  return Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
}

function getOtpExpiryMinutes(): number {
  return Number(process.env.OTP_EXPIRY_MINUTES) || 10;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateAndStoreOtp(userId: string) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + getOtpExpiryMinutes() * 60_000);

  await prisma.$transaction([
    prisma.passwordResetOtp.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.passwordResetOtp.create({
      data: { userId, otp, expiresAt },
    }),
  ]);

  return { otp, expiresAt };
}

export async function signup(data: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new ApiError(409, ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
  }

  const hashedPassword = await bcrypt.hash(data.password, getSaltRounds());

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

export async function signin(data: SigninInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new ApiError(401, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new ApiError(403, ERROR_MESSAGES.ACCOUNT_INACTIVE);
  }

  const token = signToken({ userId: user.id, tokenVersion: user.tokenVersion });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function signout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { otp, expiresAt } = await generateAndStoreOtp(user.id);

  return { email: user.email, otp, expiresAt };
}

export async function resendOtp(data: ResendOtpInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { otp, expiresAt } = await generateAndStoreOtp(user.id);

  return { email: user.email, otp, expiresAt };
}

export async function resetPassword(data: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new ApiError(400, ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP);
  }

  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord || otpRecord.otp !== data.otp || otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, ERROR_MESSAGES.INVALID_OR_EXPIRED_OTP);
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, getSaltRounds());

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    }),
  ]);
}
