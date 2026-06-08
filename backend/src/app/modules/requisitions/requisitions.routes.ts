import express from 'express';

import { uploadRequisitionAttachment } from '../../middlewares/uploadRequisitionAttachment';
import validateRequest from '../../middlewares/validateRequest';
import { RequisitionsController } from './requisitions.controller';
import { RequisitionsValidation } from './requisitions.validation';

const router = express.Router();

router.post(
  '/',
  uploadRequisitionAttachment.single('attachment'),
  RequisitionsController.createRequisition
);

router.get(
  '/',
  validateRequest(RequisitionsValidation.getAllRequisitionsZodSchema),
  RequisitionsController.getAllRequisitions
);

router.get(
  '/:id',
  validateRequest(RequisitionsValidation.getSingleRequisitionZodSchema),
  RequisitionsController.getSingleRequisition
);

router.patch(
  '/:id',
  uploadRequisitionAttachment.single('attachment'),
  RequisitionsController.updateRequisition
);

router.delete(
  '/:id',
  validateRequest(RequisitionsValidation.deleteRequisitionZodSchema),
  RequisitionsController.deleteRequisition
);

export default router;
