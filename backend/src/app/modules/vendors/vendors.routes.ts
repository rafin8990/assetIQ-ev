import express from 'express';

import { uploadVendorImage } from '../../middlewares/uploadVendorImage';
import validateRequest from '../../middlewares/validateRequest';
import { VendorsController } from './vendors.controller';
import { VendorsValidation } from './vendors.validation';

const router = express.Router();

router.post(
  '/',
  uploadVendorImage.single('image'),
  VendorsController.createVendor
);

router.get(
  '/',
  validateRequest(VendorsValidation.getAllVendorsZodSchema),
  VendorsController.getAllVendors
);

router.get(
  '/:id',
  validateRequest(VendorsValidation.getSingleVendorZodSchema),
  VendorsController.getSingleVendor
);

router.patch(
  '/:id',
  uploadVendorImage.single('image'),
  VendorsController.updateVendor
);

router.delete(
  '/:id',
  validateRequest(VendorsValidation.deleteVendorZodSchema),
  VendorsController.deleteVendor
);

export default router;
