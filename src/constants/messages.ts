export const VALIDATION_MESSAGES = {
  NAME_MIN_LENGTH: 'Name must be at least 2 characters long',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please provide a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  NEW_PASSWORD_MIN_LENGTH: 'New password must be at least 8 characters long',
  OTP_INVALID_FORMAT: 'OTP must be exactly 6 digits',
  INVALID_MANAGER_ID: 'Manager id must be a valid UUID',
};

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_REGISTERED: 'Email is already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  ACCOUNT_INACTIVE: 'Account is inactive',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  INVALID_MANAGER: 'The specified manager is invalid',
  CANNOT_ASSIGN_SELF_AS_MANAGER: 'A user cannot be assigned as their own manager',
  CANNOT_DEACTIVATE_SELF: 'You cannot deactivate your own account',
};

export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: 'Account created successfully',
  SIGNIN_SUCCESS: 'Signed in successfully',
  SIGNOUT_SUCCESS: 'Signed out successfully',
  OTP_SENT: 'OTP generated successfully',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
  PROFILE_FETCHED_SUCCESS: 'Profile fetched successfully',
  PROFILE_UPDATED_SUCCESS: 'Profile updated successfully',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully',
  USER_CREATED_SUCCESS: 'User created successfully',
  USER_STATUS_UPDATED_SUCCESS: 'User status updated successfully',
  MANAGER_ASSIGNED_SUCCESS: 'Manager assigned successfully',
  MANAGERS_FETCHED_SUCCESS: 'Managers fetched successfully',
  USERS_FETCHED_SUCCESS: 'Users fetched successfully',
};
