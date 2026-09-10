export const globalRateLimitOptions = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
};

export const authRateLimitOptions = {
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ?? 10),
};
