import express from 'express';

import { auth, requireAnyPermission, requirePermission } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import {
  PERMISSION_ACTION_MANAGE_PERMISSIONS,
  PERMISSION_ACTION_MANAGE_USERS,
} from '../permissions/permissions.constant';
import { UsersController } from './users.controller';
import { UsersValidation } from './users.validation';

const router = express.Router();

const manageUsers = [auth, requirePermission(PERMISSION_ACTION_MANAGE_USERS)];

router.post(
  '/',
  ...manageUsers,
  validateRequest(UsersValidation.createUserZodSchema),
  UsersController.createUser
);

router.get(
  '/admins',
  ...manageUsers,
  validateRequest(UsersValidation.getAdminsZodSchema),
  UsersController.getAdminUsers
);

router.get(
  '/',
  auth,
  requireAnyPermission([
    PERMISSION_ACTION_MANAGE_USERS,
    PERMISSION_ACTION_MANAGE_PERMISSIONS,
  ]),
  validateRequest(UsersValidation.getAllUsersZodSchema),
  UsersController.getAllUsers
);

router.get(
  '/:id',
  ...manageUsers,
  validateRequest(UsersValidation.getSingleUserZodSchema),
  UsersController.getSingleUser
);

router.patch(
  '/:id',
  ...manageUsers,
  validateRequest(UsersValidation.updateUserZodSchema),
  UsersController.updateUser
);

router.delete(
  '/:id',
  ...manageUsers,
  validateRequest(UsersValidation.deleteUserZodSchema),
  UsersController.deleteUser
);

export default router;
