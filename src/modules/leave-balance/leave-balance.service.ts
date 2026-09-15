import { prisma } from '../../config/prisma.js';
import { createModuleLogger } from '../../config/logger.js';
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
