import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import {
  DayPart,
  DecisionAction,
  LeavePeriodType,
  RequestStatus,
  Role,
  type LeaveType,
  type PublicHoliday,
} from '../../generated/prisma/client.js';
import type {
  CreateLeaveRequestInput,
  HrCalendarQueryInput,
  MyLeaveRequestsQueryInput,
} from './leave-request.validation.js';

interface Actor {
  id: string;
  role: string;
}

// NOTE: HR is intentionally not special-cased anywhere in this module yet.
// Every permission check below is scoped to EMPLOYEE/MANAGER; a future pass
// can extend `assertCanDecide`/`assertCanView` to add HR's company-wide access
// without needing to rewrite the checks that already exist.

// ---- date helpers -----------------------------------------------------

function toUtcDate(value: string | Date): Date {
  const iso = typeof value === 'string' ? value : value.toISOString().slice(0, 10);
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function* eachDay(start: Date, end: Date): Generator<Date> {
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    yield new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

function getHalfYearWindow(date: Date): { start: Date; end: Date } {
  const year = date.getUTCFullYear();
  const isFirstHalf = date.getUTCMonth() < 6;
  return isFirstHalf
    ? { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 5, 30)) }
    : { start: new Date(Date.UTC(year, 6, 1)), end: new Date(Date.UTC(year, 11, 31)) };
}

function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, monthNum - 1, 1)),
    end: new Date(Date.UTC(year, monthNum, 0)),
  };
}

// ---- business-rule helpers ---------------------------------------------

function computeWorkingDays(
  startDate: Date,
  endDate: Date,
  dayPart: DayPart,
  holidays: PublicHoliday[],
): number {
  const holidaySet = new Set(holidays.map((h) => toDateKey(h.date)));

  if (dayPart !== DayPart.FULL_DAY) {
    if (isWeekend(startDate) || holidaySet.has(toDateKey(startDate))) {
      throw new ApiError(400, ERROR_MESSAGES.LEAVE_REQUEST_HALF_DAY_ON_NON_WORKING_DAY);
    }
    return 0.5;
  }

  let count = 0;
  for (const day of eachDay(startDate, endDate)) {
    if (!isWeekend(day) && !holidaySet.has(toDateKey(day))) {
      count += 1;
    }
  }

  if (count === 0) {
    throw new ApiError(400, ERROR_MESSAGES.LEAVE_REQUEST_ZERO_DAYS);
  }

  return count;
}

async function checkAdvanceNotice(
  leaveType: LeaveType,
  startDate: Date,
  today: Date,
): Promise<void> {
  if (leaveType.minAdvanceNoticeDays === 0) {
    return;
  }

  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gt: today, lt: startDate } },
  });
  const holidaySet = new Set(holidays.map((h) => toDateKey(h.date)));

  let workingDaysBetween = 0;
  const cursor = new Date(today);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor.getTime() < startDate.getTime()) {
    if (!isWeekend(cursor) && !holidaySet.has(toDateKey(cursor))) {
      workingDaysBetween += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (workingDaysBetween < leaveType.minAdvanceNoticeDays) {
    throw new ApiError(
      400,
      `This leave type requires at least ${leaveType.minAdvanceNoticeDays} working day(s) advance notice`,
    );
  }
}

async function checkPeriodLimit(
  leaveType: LeaveType,
  employeeId: string,
  startDate: Date,
): Promise<void> {
  if (leaveType.periodType === LeavePeriodType.NONE || !leaveType.maxRequestsPerPeriod) {
    return;
  }

  let windowStart: Date;
  let windowEnd: Date;

  switch (leaveType.periodType) {
    case LeavePeriodType.HALF_YEAR: {
      ({ start: windowStart, end: windowEnd } = getHalfYearWindow(startDate));
      break;
    }
    default:
      return;
  }

  const count = await prisma.leaveRequest.count({
    where: {
      employeeId,
      leaveTypeId: leaveType.id,
      startDate: { gte: windowStart, lte: windowEnd },
      status: { notIn: [RequestStatus.REJECTED, RequestStatus.CANCELLED] },
    },
  });

  if (count >= leaveType.maxRequestsPerPeriod) {
    throw new ApiError(400, ERROR_MESSAGES.LEAVE_REQUEST_PERIOD_LIMIT_EXCEEDED);
  }
}

async function assertCanDecide(
  request: { employeeId: string; employee: { managerId: string | null } },
  actor: Actor,
): Promise<void> {
  if (request.employeeId === actor.id) {
    throw new ApiError(403, ERROR_MESSAGES.CANNOT_APPROVE_OWN_REQUEST);
  }

  if (request.employee.managerId !== actor.id) {
    throw new ApiError(403, ERROR_MESSAGES.NOT_YOUR_TEAM_MEMBER);
  }
}

function assertCanView(
  request: { employeeId: string; employee: { managerId: string | null } },
  actor: Actor,
): void {
  const isOwner = request.employeeId === actor.id;
  const isManager = request.employee.managerId === actor.id;

  if (!isOwner && !isManager) {
    throw new ApiError(403, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }
}

// ---- service functions ---------------------------------------------------

export async function createLeaveRequest(employeeId: string, input: CreateLeaveRequestInput) {
  const startDate = toUtcDate(input.startDate);
  const endDate = toUtcDate(input.endDate);

  if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
    throw new ApiError(400, ERROR_MESSAGES.LEAVE_REQUEST_CROSS_YEAR_NOT_ALLOWED);
  }

  const leaveType = await prisma.leaveType.findUnique({ where: { id: input.leaveTypeId } });

  if (!leaveType) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_TYPE_NOT_FOUND);
  }

  if (!leaveType.isActive) {
    throw new ApiError(400, ERROR_MESSAGES.LEAVE_TYPE_INACTIVE);
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (!leaveType.allowsPastDates && startDate.getTime() < today.getTime()) {
    throw new ApiError(400, ERROR_MESSAGES.LEAVE_REQUEST_PAST_DATE_NOT_ALLOWED);
  }

  await checkAdvanceNotice(leaveType, startDate, today);

  const holidays = await prisma.publicHoliday.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const days = computeWorkingDays(startDate, endDate, input.dayPart, holidays);

  if (days > leaveType.maxDaysPerRequest) {
    throw new ApiError(
      400,
      `This leave type allows a maximum of ${leaveType.maxDaysPerRequest} day(s) per request`,
    );
  }

  await checkPeriodLimit(leaveType, employeeId, startDate);

  if (leaveType.deductsBalance) {
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_leaveTypeId_year: {
          userId: employeeId,
          leaveTypeId: leaveType.id,
          year: startDate.getUTCFullYear(),
        },
      },
    });

    if (!balance) {
      throw new ApiError(422, ERROR_MESSAGES.NO_LEAVE_BALANCE_ALLOCATED);
    }

    if (balance.remaining < days) {
      throw new ApiError(409, ERROR_MESSAGES.INSUFFICIENT_LEAVE_BALANCE);
    }
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        days,
        dayPart: input.dayPart,
        status: RequestStatus.PENDING,
        note: input.note,
      },
    });

    await tx.auditLog.create({
      data: { requestId: request.id, actorId: employeeId, action: DecisionAction.SUBMITTED },
    });

    return request;
  });
}

export async function listMyLeaveRequests(employeeId: string, query: MyLeaveRequestsQueryInput) {
  return prisma.leaveRequest.findMany({
    where: {
      employeeId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
      ...(query.startDate ? { startDate: { gte: toUtcDate(query.startDate) } } : {}),
      ...(query.endDate ? { endDate: { lte: toUtcDate(query.endDate) } } : {}),
    },
    include: {
      leaveType: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLeaveRequestById(requestId: string, actor: Actor) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { id: true, name: true, managerId: true } },
      leaveType: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  assertCanView(request, actor);

  const overlappingTeamRequests = await prisma.leaveRequest.findMany({
    where: {
      id: { not: requestId },
      status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      startDate: { lte: request.endDate },
      endDate: { gte: request.startDate },
      employee: { managerId: request.employee.managerId },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      dayPart: true,
      status: true,
      employee: { select: { id: true, name: true } },
      leaveType: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return { ...request, overlappingTeamRequests };
}

export async function cancelLeaveRequest(requestId: string, actor: Actor, reason?: string) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { leaveType: { select: { deductsBalance: true } } },
  });

  if (!request) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  if (request.employeeId !== actor.id) {
    throw new ApiError(403, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  if (request.status === RequestStatus.REJECTED || request.status === RequestStatus.CANCELLED) {
    throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_CANCELLABLE);
  }

  if (request.status === RequestStatus.PENDING) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.updateMany({
        where: { id: requestId, status: RequestStatus.PENDING },
        data: { status: RequestStatus.CANCELLED, decidedAt: new Date(), decidedById: actor.id },
      });

      if (updated.count === 0) {
        throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_CANCELLABLE);
      }

      await tx.auditLog.create({
        data: { requestId, actorId: actor.id, action: DecisionAction.CANCELLED, reason },
      });

      return tx.leaveRequest.findUniqueOrThrow({ where: { id: requestId } });
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.updateMany({
      where: { id: requestId, status: RequestStatus.APPROVED },
      data: { status: RequestStatus.CANCELLED, decidedAt: new Date(), decidedById: actor.id },
    });

    if (updated.count === 0) {
      throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_CANCELLABLE);
    }

    if (request.leaveType.deductsBalance) {
      await tx.leaveBalance.update({
        where: {
          userId_leaveTypeId_year: {
            userId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year: request.startDate.getUTCFullYear(),
          },
        },
        data: { remaining: { increment: request.days } },
      });
    }

    await tx.auditLog.create({
      data: { requestId, actorId: actor.id, action: DecisionAction.CANCELLED, reason },
    });

    return tx.leaveRequest.findUniqueOrThrow({ where: { id: requestId } });
  });
}

export async function listTeamPendingRequests(manager: Actor) {
  return prisma.leaveRequest.findMany({
    where: { status: RequestStatus.PENDING, employee: { managerId: manager.id } },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      leaveType: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function approveLeaveRequest(requestId: string, approver: Actor) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: {
      employee: { select: { id: true, managerId: true } },
      leaveType: { select: { deductsBalance: true } },
    },
  });

  if (!request) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  await assertCanDecide(request, approver);

  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_PENDING);
  }

  return prisma.$transaction(async (tx) => {
    const requestUpdate = await tx.leaveRequest.updateMany({
      where: { id: requestId, status: RequestStatus.PENDING },
      data: { status: RequestStatus.APPROVED, decidedAt: new Date(), decidedById: approver.id },
    });

    if (requestUpdate.count === 0) {
      throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_PENDING);
    }

    if (request.leaveType.deductsBalance) {
      const balanceUpdate = await tx.leaveBalance.updateMany({
        where: {
          userId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getUTCFullYear(),
          remaining: { gte: request.days },
        },
        data: { remaining: { decrement: request.days } },
      });

      if (balanceUpdate.count === 0) {
        throw new ApiError(409, ERROR_MESSAGES.INSUFFICIENT_LEAVE_BALANCE);
      }
    }

    await tx.auditLog.create({
      data: {
        requestId,
        actorId: approver.id,
        action: DecisionAction.APPROVED,
        metadata: { days: request.days, leaveTypeId: request.leaveTypeId },
      },
    });

    return tx.leaveRequest.findUniqueOrThrow({ where: { id: requestId } });
  });
}

export async function rejectLeaveRequest(requestId: string, rejecter: Actor, reason: string) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { employee: { select: { id: true, managerId: true } } },
  });

  if (!request) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  await assertCanDecide(request, rejecter);

  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_PENDING);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.updateMany({
      where: { id: requestId, status: RequestStatus.PENDING },
      data: {
        status: RequestStatus.REJECTED,
        decidedAt: new Date(),
        decidedById: rejecter.id,
        rejectionReason: reason,
      },
    });

    if (updated.count === 0) {
      throw new ApiError(409, ERROR_MESSAGES.LEAVE_REQUEST_NOT_PENDING);
    }

    await tx.auditLog.create({
      data: { requestId, actorId: rejecter.id, action: DecisionAction.REJECTED, reason },
    });

    return tx.leaveRequest.findUniqueOrThrow({ where: { id: requestId } });
  });
}

export async function getAuditLogsForRequest(requestId: string, actor: Actor) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { id: true, employeeId: true, employee: { select: { managerId: true } } },
  });

  if (!request) {
    throw new ApiError(404, ERROR_MESSAGES.LEAVE_REQUEST_NOT_FOUND);
  }

  assertCanView({ employeeId: request.employeeId, employee: request.employee }, actor);

  return prisma.auditLog.findMany({
    where: { requestId },
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getTeamCalendar(actor: Actor, month: string) {
  const { start: monthStart, end: monthEnd } = getMonthRange(month);

  let teamManagerId: string | null;

  if (actor.role === 'MANAGER') {
    teamManagerId = actor.id;
  } else {
    const self = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { managerId: true },
    });
    teamManagerId = self?.managerId ?? null;
  }

  if (!teamManagerId) {
    return [];
  }

  return prisma.leaveRequest.findMany({
    where: {
      status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
      employee: { managerId: teamManagerId },
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      dayPart: true,
      status: true,
      employee: { select: { id: true, name: true } },
      leaveType: { select: { id: true, name: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getHrCalendar(query: HrCalendarQueryInput) {
  const { month, employeeId, role } = query;
  const { start: monthStart, end: monthEnd } = getMonthRange(month);

  let employeeFilter: { id: string } | { OR: [{ id: string }, { managerId: string }] } | undefined;

  if (employeeId && role === Role.MANAGER) {
    const manager = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, role: true },
    });

    if (!manager || manager.role !== Role.MANAGER) {
      throw new ApiError(400, ERROR_MESSAGES.MANAGER_NOT_FOUND);
    }

    employeeFilter = { OR: [{ id: employeeId }, { managerId: employeeId }] };
  } else if (employeeId) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      throw new ApiError(404, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    employeeFilter = { id: employeeId };
  }

  return prisma.leaveRequest.findMany({
    where: {
      status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
      ...(employeeFilter ? { employee: employeeFilter } : {}),
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      dayPart: true,
      status: true,
      note: true,
      employee: { select: { id: true, name: true, manager: { select: { id: true, name: true } } } },
      leaveType: { select: { id: true, name: true } },
    },
    orderBy: [{ employee: { name: 'asc' } }, { startDate: 'asc' }],
  });
}
