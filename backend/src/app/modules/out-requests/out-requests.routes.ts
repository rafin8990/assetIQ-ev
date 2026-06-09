import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import {
  PERMISSION_ACTION_APPROVE_OUT_REQUEST,
  PERMISSION_ACTION_PROCESS_OUT,
} from '../permissions/permissions.constant';
import validateRequest from '../../middlewares/validateRequest';
import { OutRequestsController } from './out-requests.controller';
import { OutRequestsValidation } from './out-requests.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(OutRequestsValidation.createOutRequestZodSchema),
  OutRequestsController.createOutRequest
);

router.get(
  '/',
  validateRequest(OutRequestsValidation.getAllOutRequestsZodSchema),
  OutRequestsController.getAllOutRequests
);

router.get(
  '/reports/daily',
  validateRequest(OutRequestsValidation.getDailyReportZodSchema),
  OutRequestsController.getDailyReport
);

router.get(
  '/reports/date-range',
  validateRequest(OutRequestsValidation.getDateRangeReportZodSchema),
  OutRequestsController.getDateRangeReport
);

router.get(
  '/reports/monthwise',
  validateRequest(OutRequestsValidation.getMonthwiseReportZodSchema),
  OutRequestsController.getMonthwiseReport
);

router.get(
  '/reports/user-wise',
  validateRequest(OutRequestsValidation.getUserWiseReportZodSchema),
  OutRequestsController.getUserWiseReport
);

router.get(
  '/:id',
  validateRequest(OutRequestsValidation.getSingleOutRequestZodSchema),
  OutRequestsController.getSingleOutRequest
);

router.patch(
  '/:id',
  validateRequest(OutRequestsValidation.updateOutRequestZodSchema),
  OutRequestsController.updateOutRequest
);

router.delete(
  '/:id',
  auth,
  validateRequest(OutRequestsValidation.deleteOutRequestZodSchema),
  OutRequestsController.deleteOutRequest
);

router.patch(
  '/:id/approve',
  auth,
  requirePermission(PERMISSION_ACTION_APPROVE_OUT_REQUEST),
  validateRequest(OutRequestsValidation.approveOutRequestZodSchema),
  OutRequestsController.approveOutRequest
);

router.patch(
  '/:id/cancel',
  validateRequest(OutRequestsValidation.cancelOutRequestZodSchema),
  OutRequestsController.cancelOutRequest
);

router.patch(
  '/:id/out',
  auth,
  requirePermission(PERMISSION_ACTION_PROCESS_OUT),
  validateRequest(OutRequestsValidation.processOutRequestZodSchema),
  OutRequestsController.processOutRequest
);

export default router;
