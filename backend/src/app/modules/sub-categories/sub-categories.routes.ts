import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { SubCategoriesController } from './sub-categories.controller';
import { SubCategoriesValidation } from './sub-categories.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(SubCategoriesValidation.createSubCategoryZodSchema),
  SubCategoriesController.createSubCategory
);

router.get(
  '/',
  validateRequest(SubCategoriesValidation.getAllSubCategoriesZodSchema),
  SubCategoriesController.getAllSubCategories
);

router.get(
  '/:id',
  validateRequest(SubCategoriesValidation.getSingleSubCategoryZodSchema),
  SubCategoriesController.getSingleSubCategory
);

router.patch(
  '/:id',
  validateRequest(SubCategoriesValidation.updateSubCategoryZodSchema),
  SubCategoriesController.updateSubCategory
);

router.delete(
  '/:id',
  validateRequest(SubCategoriesValidation.deleteSubCategoryZodSchema),
  SubCategoriesController.deleteSubCategory
);

export default router;
