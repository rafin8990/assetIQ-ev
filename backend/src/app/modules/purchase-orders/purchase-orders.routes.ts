import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import {
  PERMISSION_ACTION_APPROVE_PURCHASE_ORDER,
  PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER,
} from '../permissions/permissions.constant';
import { uploadPurchaseOrderAttachment } from '../../middlewares/uploadPurchaseOrderAttachment';
import validateRequest from '../../middlewares/validateRequest';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersValidation } from './purchase-orders.validation';

const router = express.Router();

router.post(
  '/',
  uploadPurchaseOrderAttachment.single('attachment'),
  PurchaseOrdersController.createPurchaseOrder
);

router.get(
  '/',
  validateRequest(PurchaseOrdersValidation.getAllPurchaseOrdersZodSchema),
  PurchaseOrdersController.getAllPurchaseOrders
);

router.get(
  '/reports/daily',
  validateRequest(PurchaseOrdersValidation.getDailyReportZodSchema),
  PurchaseOrdersController.getDailyReport
);

router.get(
  '/reports/date-range',
  validateRequest(PurchaseOrdersValidation.getDateRangeReportZodSchema),
  PurchaseOrdersController.getDateRangeReport
);

router.get(
  '/reports/due-paid',
  validateRequest(PurchaseOrdersValidation.getDuePaidReportZodSchema),
  PurchaseOrdersController.getDuePaidReport
);

router.get(
  '/reports/monthwise',
  validateRequest(PurchaseOrdersValidation.getMonthwiseReportZodSchema),
  PurchaseOrdersController.getMonthwiseReport
);

router.get(
  '/staging',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.getStagingPurchaseOrdersZodSchema),
  PurchaseOrdersController.getStagingPurchaseOrders
);

router.get(
  '/:id/staging/returns',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.getVendorReturnsZodSchema),
  PurchaseOrdersController.getVendorReturns
);

router.get(
  '/:id/staging',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.getStagingDetailZodSchema),
  PurchaseOrdersController.getStagingDetail
);

router.post(
  '/:id/staging/receive',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.recordStagingReceiptZodSchema),
  PurchaseOrdersController.recordStagingReceipt
);

router.post(
  '/:id/staging/returns',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.returnToVendorZodSchema),
  PurchaseOrdersController.returnToVendor
);

router.post(
  '/:id/staging/accept',
  auth,
  requirePermission(PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER),
  validateRequest(PurchaseOrdersValidation.acceptStagingToStockZodSchema),
  PurchaseOrdersController.acceptStagingToStock
);

router.get(
  '/:id',
  validateRequest(PurchaseOrdersValidation.getSinglePurchaseOrderZodSchema),
  PurchaseOrdersController.getSinglePurchaseOrder
);

router.patch(
  '/:id',
  uploadPurchaseOrderAttachment.single('attachment'),
  PurchaseOrdersController.updatePurchaseOrder
);

router.patch(
  '/:id/approve',
  auth,
  requirePermission(PERMISSION_ACTION_APPROVE_PURCHASE_ORDER),
  PurchaseOrdersController.approvePurchaseOrder
);

router.patch(
  '/:id/cancel',
  PurchaseOrdersController.cancelPurchaseOrder
);

router.delete(
  '/:id',
  validateRequest(PurchaseOrdersValidation.deletePurchaseOrderZodSchema),
  PurchaseOrdersController.deletePurchaseOrder
);

export default router;
