import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { createModuleLogger } from '../config/logger.js';
import { syncLeaveBalancesForYear } from '../modules/leave-balance/leave-balance.service.js';

const logger = createModuleLogger('leave-balance-sync-cron');

const YEARLY_SCHEDULE = '0 0 1 1 *'; // production: every Jan 1 at 00:00
// const YEARLY_SCHEDULE = '0 * * * *'; // TESTING ONLY: uncomment to run hourly, comment out the line above
// const YEARLY_SCHEDULE = '* * * * *'; // TESTING ONLY: uncomment to run every minute, comment out the lines above

async function runSync(): Promise<void> {
  const year = new Date().getFullYear();
  logger.info('Leave balance sync started', { year });

  try {
    const result = await syncLeaveBalancesForYear(year);
    logger.info('Leave balance sync completed', result);
  } catch (error) {
    logger.error('Leave balance sync failed', {
      year,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function startLeaveBalanceSyncJob(): ScheduledTask {
  return cron.schedule(YEARLY_SCHEDULE, () => void runSync());
}
