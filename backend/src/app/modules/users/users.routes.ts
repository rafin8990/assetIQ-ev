import express from 'express';

import { auth, requireRole } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { UsersController } from './users.controller';
import { UsersValidation } from './users.validation';

const router = express.Router();

const adminRoles = [ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN];

router.post(
  '/',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.createUserZodSchema),
  UsersController.createUser
);

router.get(
  '/admins',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.getAdminsZodSchema),
  UsersController.getAdminUsers
);

router.get(
  '/',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.getAllUsersZodSchema),
  UsersController.getAllUsers
);

router.get(
  '/:id',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.getSingleUserZodSchema),
  UsersController.getSingleUser
);

router.patch(
  '/:id',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.updateUserZodSchema),
  UsersController.updateUser
);

router.delete(
  '/:id',
  auth,
  requireRole(adminRoles),
  validateRequest(UsersValidation.deleteUserZodSchema),
  UsersController.deleteUser
);

export default router;
