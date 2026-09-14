import 'dotenv/config';
import app from './app.js';
import { logger } from './config/logger.js';
import { disconnectPrisma, prisma } from './config/prisma.js';
import { startLeaveBalanceSyncJob } from './jobs/leave-balance-sync.job.js';

const PORT = process.env.PORT ?? 3000;

async function bootstrap(): Promise<void> {
  try {
    // $connect() resolves without validating connectivity when using a driver
    // adapter (connections are established lazily on first query), so a real
    // query is required to fail fast on an unreachable database.
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Prisma connected to database');
  } catch (error) {
    logger.error('Failed to connect Prisma to database', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  const leaveBalanceSyncTask = startLeaveBalanceSyncJob();
  logger.info('Leave balance sync cron job scheduled');

  async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received: starting graceful shutdown`);

    leaveBalanceSyncTask.stop();

    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('Error while closing HTTP server', { error: err.message });
        } else {
          logger.info('HTTP server closed');
        }
        resolve();
      });
    });

    try {
      await disconnectPrisma();
      logger.info('Prisma disconnected');
    } catch (error) {
      logger.error('Error while disconnecting Prisma', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

void bootstrap();
