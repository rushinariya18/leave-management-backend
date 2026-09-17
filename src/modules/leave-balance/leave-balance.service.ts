import { prisma } from '../../config/prisma.js';
import { createModuleLogger } from '../../config/logger.js';
import { ApiError } from '../../utils/ApiError.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { DayPart, DecisionAction } from '../../generated/prisma/client.js';
import { listLeaveTypes } from '../leave-type/leave-type.service.js';

const logger = createModuleLogger('leave-balance-service');

export interface LeaveBalanceSyncResult {
  year: number;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
}

export function calculateProratedAllowance(defaultAllowance: number, joinDate: Date): number {
  const joinMonth = joinDate.getUTCMonth() + 1; // 1-12
  const monthsRemaining = 12 - (joinMonth - 1);
  const raw = defaultAllowance * (monthsRemaining / 12);

  return Math.round(raw * 2) / 2; // nearest 0.5
}

export async function createInitialLeaveBalancesForUser(
  userId: string,
  joinDate: Date,
  year: number,
  tx: Pick<typeof prisma, 'leaveType' | 'leaveBalance'> = prisma,
): Promise<void> {
  const activeLeaveTypes = await tx.leaveType.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  if (activeLeaveTypes.length === 0) {
    return;
  }

  const balancesData = activeLeaveTypes.map((leaveType) => {
    const allocated = calculateProratedAllowance(leaveType.defaultAllowance, joinDate);

    return {
      userId,
      leaveTypeId: leaveType.id,
      year,
      allocated,
      remaining: allocated,
      carriedForward: 0,
    };
  });

  await tx.leaveBalance.createMany({ data: balancesData });
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatLeaveDateLabel(startDate: Date, endDate: Date, dayPart: DayPart): string {
  const range =
    startDate.getTime() === endDate.getTime()
      ? formatLongDate(startDate)
      : `${formatLongDate(startDate)} - ${formatLongDate(endDate)}`;

  if (dayPart === DayPart.FIRST_HALF) return `${range} (First half)`;
  if (dayPart === DayPart.SECOND_HALF) return `${range} (Second half)`;
  return range;
}

export async function getMyLeaveBalances(userId: string) {
  const year = new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: { userId, year, leaveType: { isActive: true } },
    include: { leaveType: { select: { id: true, name: true } } },
    orderBy: { leaveType: { name: 'asc' } },
  });

  return balances.map((balance) => ({
    leaveTypeId: balance.leaveType.id,
    leaveTypeName: balance.leaveType.name,
    total: balance.allocated,
    available: balance.remaining,
    consumed: balance.allocated - balance.remaining,
  }));
}

export async function getLeaveBalanceHistory(userId: string, leaveTypeId: string) {
  const year = new Date().getFullYear();

  const [balance, user] = await Promise.all([
    prisma.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
      include: { leaveType: { select: { id: true, name: true } } },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { joinDate: true } }),
  ]);

  if (!balance) {
    throw new ApiError(404, ERROR_MESSAGES.NO_LEAVE_BALANCE_ALLOCATED);
  }

  const carryForward = await prisma.leaveCarryForward.findUnique({
    where: { userId_leaveTypeId_fromYear: { userId, leaveTypeId, fromYear: year - 1 } },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: { in: [DecisionAction.APPROVED, DecisionAction.CANCELLED] },
      request: {
        employeeId: userId,
        leaveTypeId,
        startDate: { gte: new Date(Date.UTC(year, 0, 1)), lte: new Date(Date.UTC(year, 11, 31)) },
      },
    },
    select: {
      requestId: true,
      action: true,
      createdAt: true,
      request: { select: { days: true, dayPart: true, startDate: true, endDate: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const approvedRequestIds = new Set(
    auditLogs.filter((log) => log.action === DecisionAction.APPROVED).map((log) => log.requestId),
  );

  const entries: Array<{ date: Date; change: number; reason: string; requestId: string | null }> = [];

  const joinedThisYear = user.joinDate.getUTCFullYear() === year;
  entries.push({
    date: joinedThisYear ? user.joinDate : new Date(Date.UTC(year, 0, 1)),
    change: balance.allocated - balance.carriedForward,
    reason: joinedThisYear
      ? 'Prorated leave accrual allocated for new joiner.'
      : 'Leave Accrual allocated at the start of year.',
    requestId: null,
  });

  if (carryForward && carryForward.daysCarried > 0) {
    entries.push({
      date: new Date(Date.UTC(year, 0, 1)),
      change: carryForward.daysCarried,
      reason: `Carried forward from ${carryForward.fromYear}`,
      requestId: null,
    });
  }

  for (const log of auditLogs) {
    const label = formatLeaveDateLabel(log.request.startDate, log.request.endDate, log.request.dayPart);

    if (log.action === DecisionAction.APPROVED) {
      entries.push({
        date: log.createdAt,
        change: -log.request.days,
        reason: `Leave applied for ${label}`,
        requestId: log.requestId,
      });
    } else if (approvedRequestIds.has(log.requestId)) {
      entries.push({
        date: log.createdAt,
        change: log.request.days,
        reason: `Leave cancelled for ${label}`,
        requestId: log.requestId,
      });
    }
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = 0;
  const history = entries
    .map((entry) => {
      runningBalance += entry.change;
      return {
        transactionDate: entry.date,
        change: entry.change,
        balance: runningBalance,
        reason: entry.reason,
        requestId: entry.requestId,
      };
    })
    .reverse();

  return {
    leaveTypeId: balance.leaveType.id,
    leaveTypeName: balance.leaveType.name,
    year,
    currentBalance: balance.remaining,
    history,
  };
}

export async function syncLeaveBalancesForYear(year: number): Promise<LeaveBalanceSyncResult> {
  const previousYear = year - 1;

  const [activeUsers, activeLeaveTypes] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true } }),
    listLeaveTypes(),
  ]);

  const result: LeaveBalanceSyncResult = {
    year,
    processed: 0,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  for (const user of activeUsers) {
    for (const leaveType of activeLeaveTypes) {
      result.processed += 1;

      try {
        const existingBalance = await prisma.leaveBalance.findUnique({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year,
            },
          },
        });

        if (existingBalance) {
          result.skipped += 1;
          continue;
        }

        const previousBalance = await prisma.leaveBalance.findUnique({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year: previousYear,
            },
          },
        });

        const carriedForward =
          previousBalance && leaveType.allowsCarryForward
            ? Math.min(previousBalance.remaining, leaveType.maxCarryForwardDays ?? 0)
            : 0;
        const allocated = leaveType.defaultAllowance + carriedForward;

        await prisma.leaveBalance.upsert({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year,
            },
          },
          create: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year,
            allocated,
            remaining: allocated,
            carriedForward,
          },
          update: {},
        });

        if (carriedForward > 0) {
          await prisma.leaveCarryForward.upsert({
            where: {
              userId_leaveTypeId_fromYear: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                fromYear: previousYear,
              },
            },
            create: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              fromYear: previousYear,
              toYear: year,
              daysCarried: carriedForward,
            },
            update: {},
          });
        }

        result.created += 1;
      } catch (error) {
        result.failed += 1;
        logger.error('Failed to sync leave balance', {
          userId: user.id,
          leaveTypeId: leaveType.id,
          year,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return result;
}
