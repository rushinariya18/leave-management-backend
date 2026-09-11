export const globalRateLimitOptions = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
};

export const signinRateLimitOptions = {
  windowMs: Number(process.env.SIGNIN_RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.SIGNIN_RATE_LIMIT_MAX_REQUESTS ?? 5),
};

export const otpRateLimitOptions = {
  windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW_MS ?? 600000),
  max: Number(process.env.OTP_RATE_LIMIT_MAX_REQUESTS ?? 3),
};

export const resetPasswordRateLimitOptions = {
  windowMs: Number(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS ?? 900000),
  max: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX_REQUESTS ?? 5),
};
