export const VALIDATION_MESSAGES = {
  NAME_MIN_LENGTH: 'Name must be at least 2 characters long',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please provide a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  NEW_PASSWORD_MIN_LENGTH: 'New password must be at least 8 characters long',
  OTP_INVALID_FORMAT: 'OTP must be exactly 6 digits',
};

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_REGISTERED: 'Email is already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  ACCOUNT_INACTIVE: 'Account is inactive',
};

export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully',
  SIGNIN_SUCCESS: 'Signed in successfully',
  SIGNOUT_SUCCESS: 'Signed out successfully',
  OTP_SENT: 'OTP generated successfully',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
};
