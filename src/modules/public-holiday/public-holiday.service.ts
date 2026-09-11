import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import type {
  CreatePublicHolidayInput,
  ListPublicHolidaysQueryInput,
  UpdatePublicHolidayInput,
} from './public-holiday.validation.js';

export async function createHoliday(data: CreatePublicHolidayInput) {
  const date = new Date(data.date);

  const existing = await prisma.publicHoliday.findUnique({ where: { date } });

  if (existing) {
    throw new ApiError(409, ERROR_MESSAGES.HOLIDAY_ALREADY_EXISTS);
  }

  return prisma.publicHoliday.create({
    data: {
      date,
      name: data.name,
      year: date.getFullYear(),
    },
  });
}

export async function updateHoliday(id: string, data: UpdatePublicHolidayInput) {
  const holiday = await prisma.publicHoliday.findUnique({ where: { id } });

  if (!holiday) {
    throw new ApiError(404, ERROR_MESSAGES.HOLIDAY_NOT_FOUND);
  }

  let date: Date | undefined;

  if (data.date) {
    date = new Date(data.date);

    const existing = await prisma.publicHoliday.findUnique({ where: { date } });

    if (existing && existing.id !== id) {
      throw new ApiError(409, ERROR_MESSAGES.HOLIDAY_ALREADY_EXISTS);
    }
  }

  return prisma.publicHoliday.update({
    where: { id },
    data: {
      ...(date ? { date, year: date.getFullYear() } : {}),
      ...(data.name ? { name: data.name } : {}),
    },
  });
}

export async function deleteHoliday(id: string) {
  const holiday = await prisma.publicHoliday.findUnique({ where: { id } });

  if (!holiday) {
    throw new ApiError(404, ERROR_MESSAGES.HOLIDAY_NOT_FOUND);
  }

  await prisma.publicHoliday.delete({ where: { id } });
}

export async function listHolidays(query: ListPublicHolidaysQueryInput) {
  const where = query.year ? { year: Number(query.year) } : {};

  return prisma.publicHoliday.findMany({ where, orderBy: { date: 'asc' } });
}
