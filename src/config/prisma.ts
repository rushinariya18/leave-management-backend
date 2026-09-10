import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { createModuleLogger } from './logger.js';

const prismaLogger = createModuleLogger('prisma');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  prismaLogger.debug(e.query, { params: e.params, durationMs: e.duration });
});

prisma.$on('warn', (e) => {
  prismaLogger.warn(e.message);
});

prisma.$on('error', (e) => {
  prismaLogger.error(e.message);
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
