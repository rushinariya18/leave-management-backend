import bcrypt from 'bcrypt';
import { prisma } from '../../config/prisma.js';
import { Role } from '../../generated/prisma/client.js';
import { ApiError } from '../../utils/ApiError.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination.js';
import { createInitialLeaveBalancesForUser } from '../leave-balance/leave-balance.service.js';
import type {
  AssignManagerInput,
  ChangePasswordInput,
  CreateUserInput,
  ListUsersQueryInput,
  UpdateProfileInput,
} from './user.validation.js';

function getSaltRounds(): number {
  return Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  managerId: true,
  isActive: true,
  joinDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });

  if (!user) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name },
    select: userSelect,
  });
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(data.currentPassword, user.password);

  if (!isMatch) {
    throw new ApiError(400, ERROR_MESSAGES.CURRENT_PASSWORD_INCORRECT);
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, getSaltRounds());

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, tokenVersion: { increment: 1 } },
  });
}

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });

  if (existing) {
    throw new ApiError(409, ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
  }

  if (data.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
      select: { id: true, role: true },
    });

    if (!manager) {
      throw new ApiError(404, ERROR_MESSAGES.INVALID_MANAGER);
    }

    if (manager.role !== Role.MANAGER) {
      throw new ApiError(400, ERROR_MESSAGES.INVALID_MANAGER);
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, getSaltRounds());

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        managerId: data.managerId ?? null,
      },
      select: userSelect,
    });

    await createInitialLeaveBalancesForUser(user.id, user.joinDate, new Date().getUTCFullYear(), tx);

    return user;
  });
}

export async function setUserActive(targetUserId: string, isActive: boolean, actingUserId: string) {
  if (targetUserId === actingUserId && !isActive) {
    throw new ApiError(400, ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF);
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!target) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive,
      ...(isActive ? {} : { tokenVersion: { increment: 1 } }),
    },
    select: userSelect,
  });
}

export async function assignManager(
  targetUserId: string,
  managerId: AssignManagerInput['managerId'],
) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!target) {
    throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (managerId) {
    if (managerId === targetUserId) {
      throw new ApiError(400, ERROR_MESSAGES.CANNOT_ASSIGN_SELF_AS_MANAGER);
    }

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true },
    });

    if (!manager) {
      throw new ApiError(404, ERROR_MESSAGES.INVALID_MANAGER);
    }

    if (manager.role !== Role.MANAGER) {
      throw new ApiError(400, ERROR_MESSAGES.INVALID_MANAGER);
    }
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { managerId },
    select: userSelect,
  });
}

const managerListSelect = { id: true, name: true, email: true } as const;

export async function listManagers(query: { page?: unknown; limit?: unknown; search?: unknown }) {
  const { page, limit, skip } = parsePagination(query);
  const search =
    typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

  const where = {
    role: Role.MANAGER,
    isActive: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: managerListSelect,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  manager: { select: { id: true, name: true } },
} as const;

function buildUserOrderBy(
  sortBy?: ListUsersQueryInput['sortBy'],
  sortOrder?: ListUsersQueryInput['sortOrder'],
) {
  const order = sortOrder ?? (sortBy ? 'asc' : 'desc');

  if (sortBy === 'manager') {
    return { manager: { name: order } };
  }

  return { [sortBy ?? 'createdAt']: order };
}

export async function listUsers(query: ListUsersQueryInput) {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { email: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.managerId ? { managerId: query.managerId } : {}),
  };

  const orderBy = buildUserOrderBy(query.sortBy, query.sortOrder);

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: userListSelect, orderBy, skip, take: limit }),
    prisma.user.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}
