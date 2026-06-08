import express from 'express';

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
  PurchaseOrdersController.approvePurchaseOrder
);

router.patch(
  '/:id/cancel',
  PurchaseOrdersController.cancelPurchaseOrder
);

router.patch(
  '/:id/receive',
  PurchaseOrdersController.receivePurchaseOrder
);

router.delete(
  '/:id',
  validateRequest(PurchaseOrdersValidation.deletePurchaseOrderZodSchema),
  PurchaseOrdersController.deletePurchaseOrder
);

export default router;
