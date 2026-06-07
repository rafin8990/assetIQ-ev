import express from 'express';

import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.refreshToken
);

router.get('/profile', auth, AuthController.getProfile);

router.patch(
  '/profile',
  auth,
  validateRequest(AuthValidation.updateProfileZodSchema),
  AuthController.updateProfile
);

router.patch(
  '/change-password',
  auth,
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword
);

export default router;
