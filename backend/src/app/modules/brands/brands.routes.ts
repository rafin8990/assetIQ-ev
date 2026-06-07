import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { BrandsController } from './brands.controller';
import { BrandsValidation } from './brands.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(BrandsValidation.createBrandZodSchema),
  BrandsController.createBrand
);

router.get(
  '/',
  validateRequest(BrandsValidation.getAllBrandsZodSchema),
  BrandsController.getAllBrands
);

router.get(
  '/:id',
  validateRequest(BrandsValidation.getSingleBrandZodSchema),
  BrandsController.getSingleBrand
);

router.patch(
  '/:id',
  validateRequest(BrandsValidation.updateBrandZodSchema),
  BrandsController.updateBrand
);

router.delete(
  '/:id',
  validateRequest(BrandsValidation.deleteBrandZodSchema),
  BrandsController.deleteBrand
);

export default router;
