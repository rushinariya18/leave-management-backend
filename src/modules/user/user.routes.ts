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

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.patch(
  '/me/password',
  authenticate,
  validate(changePasswordSchema),
  userController.changePassword,
);

router.get('/managers', authenticate, authorize(Role.HR), userController.listManagers);

router.get(
  '/',
  authenticate,
  authorize(Role.HR, Role.MANAGER),
  validateQuery(listUsersQuerySchema),
  userController.listUsers,
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.HR, Role.MANAGER),
  validateParams(userIdParamsSchema),
  userController.getUserById,
);

router.post(
  '/',
  authenticate,
  authorize(Role.HR),
  validate(createUserSchema),
  userController.createUser,
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.HR),
  validate(updateStatusSchema),
  userController.setUserActive,
);

router.patch(
  '/:id/manager',
  authenticate,
  authorize(Role.HR),
  validate(assignManagerSchema),
  userController.assignManager,
);

export default router;
