import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { globalRateLimiter } from './middlewares/rate-limit.middleware.js';
import { requestContext } from './middlewares/request-context.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import leaveBalanceRoutes from './modules/leave-balance/leave-balance.routes.js';
import leaveRequestRoutes from './modules/leave-request/leave-request.routes.js';
import leaveTypeRoutes from './modules/leave-type/leave-type.routes.js';
import publicHolidayRoutes from './modules/public-holiday/public-holiday.routes.js';
import userRoutes from './modules/user/user.routes.js';

import { sendSuccess } from './utils/response.js';

const app = express();

app.use(requestContext);
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalRateLimiter);
app.use(express.json());
app.use(requestLogger);

app.get('/health-check', (_req, res) => {
  sendSuccess(res, 200, 'Service is healthy');
});

// app.get('/json-check', (_req, res) => {
//   sendSuccess(res, 200, 'JSON payload is valid', { message: 'JSON payload is valid' });
// });

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/public-holidays', publicHolidayRoutes);
app.use('/api/v1/leave-types', leaveTypeRoutes);
app.use('/api/v1/leave-balances', leaveBalanceRoutes);
app.use('/api/v1/leave-requests', leaveRequestRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
