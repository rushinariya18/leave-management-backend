import { Router } from 'express';
import { Role } from '../../generated/prisma/client.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { validateParams } from '../../middlewares/validateParams.middleware.js';
import { validateQuery } from '../../middlewares/validateQuery.middleware.js';
import * as userController from './user.controller.js';
import {
  assignManagerSchema,
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateStatusSchema,
  userIdParamsSchema,
} from './user.validation.js';

const router = Router();

/**
 * @description Get the authenticated user's own profile.
 * @access Private
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @description Update the authenticated user's own profile.
 * @access Private
 */
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

/**
 * @description Change the authenticated user's own password.
 * @access Private
 */
router.patch(
  '/me/password',
  authenticate,
  validate(changePasswordSchema),
  userController.changePassword,
);

/**
 * @description List all users eligible to be assigned as a manager.
 * @access Private (HR)
 */
router.get('/managers', authenticate, authorize(Role.HR), userController.listManagers);

/**
 * @description List users, optionally filtered by query parameters.
 * @access Private (HR, MANAGER)
 */
router.get(
  '/',
  authenticate,
  authorize(Role.HR, Role.MANAGER),
  validateQuery(listUsersQuerySchema),
  userController.listUsers,
);

/**
 * @description Get the details of a single user by id.
 * @access Private (HR, MANAGER)
 */
router.get(
  '/:id',
  authenticate,
  authorize(Role.HR, Role.MANAGER),
  validateParams(userIdParamsSchema),
  userController.getUserById,
);

/**
 * @description Create a new user account.
 * @access Private (HR)
 */
router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createUserSchema),
  userController.createUser,
);

/**
 * @description Activate or deactivate a user account.
 * @access Private (HR)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.HR),
  validate(updateStatusSchema),
  userController.setUserActive,
);

/**
 * @description Assign or change the manager for a user.
 * @access Private (HR)
 */
router.patch(
  '/:id/manager',
  authenticate,
  authorize(Role.HR),
  validate(assignManagerSchema),
  userController.assignManager,
);

export default router;
