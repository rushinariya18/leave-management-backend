import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { globalRateLimiter } from './middlewares/rate-limit.middleware.js';
import { requestContext } from './middlewares/request-context.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';

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

app.get('/json-check', (_req, res) => {
  sendSuccess(res, 200, 'JSON payload is valid', { message: 'JSON payload is valid' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
