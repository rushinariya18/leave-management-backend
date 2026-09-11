import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import type {
  CreateLeaveTypeInput,
  ListLeaveTypesQueryInput,
  UpdateLeaveTypeInput,
} from './leave-type.validation.js';

export async function createLeaveType(data: CreateLeaveTypeInput) {
  const existing = await prisma.leaveType.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(409, ERROR_MESSAGES.LEAVE_TYPE_ALREADY_EXISTS);
  }
  return prisma.leaveType.create({ data });
}

export async function updateLeaveType(id: string, data: UpdateLeaveTypeInput) {
  const leaveType = await prisma.leaveType.findUnique({ where: { id } });
  if (!leaveType) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_TYPE_NOT_FOUND);
  }

  if (data.name) {
    const existing = await prisma.leaveType.findUnique({ where: { name: data.name } });
    if (existing && existing.id !== id) {
      throw new ApiError(409, ERROR_MESSAGES.LEAVE_TYPE_ALREADY_EXISTS);
    }
  }

  return prisma.leaveType.update({ where: { id }, data });
}

export async function deleteLeaveType(id: string) {
  const leaveType = await prisma.leaveType.findUnique({ where: { id } });
  if (!leaveType) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_TYPE_NOT_FOUND);
  }
  await prisma.leaveType.update({ where: { id }, data: { isActive: false } });
}

export async function listLeaveTypes(query: ListLeaveTypesQueryInput) {
  const where = query.isActive ? { isActive: query.isActive === 'true' } : {};
  return prisma.leaveType.findMany({ where, orderBy: { name: 'asc' } });
}

export async function getLeaveTypeById(id: string) {
  const leaveType = await prisma.leaveType.findUnique({ where: { id } });
  if (!leaveType) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_TYPE_NOT_FOUND);
  }
  return leaveType;
}
