import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import { PERMISSION_ACTION_APPROVE_RETURN } from '../permissions/permissions.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ReturnRequestsController } from './return-requests.controller';
import { ReturnRequestsValidation } from './return-requests.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(ReturnRequestsValidation.createReturnRequestZodSchema),
  ReturnRequestsController.createReturnRequest
);

router.get(
  '/',
  validateRequest(ReturnRequestsValidation.getAllReturnRequestsZodSchema),
  ReturnRequestsController.getAllReturnRequests
);

router.get(
  '/reports/date-range',
  validateRequest(ReturnRequestsValidation.getDateRangeReportZodSchema),
  ReturnRequestsController.getDateRangeReport
);

router.get(
  '/:id',
  validateRequest(ReturnRequestsValidation.getSingleReturnRequestZodSchema),
  ReturnRequestsController.getSingleReturnRequest
);

router.patch(
  '/:id',
  validateRequest(ReturnRequestsValidation.updateReturnRequestZodSchema),
  ReturnRequestsController.updateReturnRequest
);

router.delete(
  '/:id',
  auth,
  validateRequest(ReturnRequestsValidation.deleteReturnRequestZodSchema),
  ReturnRequestsController.deleteReturnRequest
);

router.patch(
  '/:id/approve',
  auth,
  requirePermission(PERMISSION_ACTION_APPROVE_RETURN),
  validateRequest(ReturnRequestsValidation.approveReturnRequestZodSchema),
  ReturnRequestsController.approveReturnRequest
);

router.patch(
  '/:id/cancel',
  validateRequest(ReturnRequestsValidation.cancelReturnRequestZodSchema),
  ReturnRequestsController.cancelReturnRequest
);

export default router;
