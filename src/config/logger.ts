import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const LOG_LEVEL = process.env.LOG_LEVEL ?? (NODE_ENV === 'production' ? 'info' : 'debug');

const logsDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]${module ? ` [${module}]` : ''}: ${message}${rest}`;
  }),
);

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: 'leave-management-backend' },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'warn',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}
