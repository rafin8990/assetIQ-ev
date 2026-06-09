import express from 'express';

import { PERMISSION_ACTION_MANAGE_PERMISSIONS } from './permissions.constant';
import { auth, requirePermission } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PermissionsController } from './permissions.controller';
import { PermissionsValidation } from './permissions.validation';

const router = express.Router();

const managePermissions = [
  auth,
  requirePermission(PERMISSION_ACTION_MANAGE_PERMISSIONS),
];

router.get('/', ...managePermissions, PermissionsController.getPermissionsRegistry);

router.get(
  '/users/:userId',
  ...managePermissions,
  validateRequest(PermissionsValidation.getUserPermissionsZodSchema),
  PermissionsController.getUserPermissions
);

router.put(
  '/users/:userId',
  ...managePermissions,
  validateRequest(PermissionsValidation.setUserPermissionsZodSchema),
  PermissionsController.setUserPermissions
);

export default router;
