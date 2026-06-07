import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { CategoriesController } from './categories.controller';
import { CategoriesValidation } from './categories.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(CategoriesValidation.createCategoryZodSchema),
  CategoriesController.createCategory
);

router.get(
  '/',
  validateRequest(CategoriesValidation.getAllCategoriesZodSchema),
  CategoriesController.getAllCategories
);

router.get(
  '/:id',
  validateRequest(CategoriesValidation.getSingleCategoryZodSchema),
  CategoriesController.getSingleCategory
);

router.patch(
  '/:id',
  validateRequest(CategoriesValidation.updateCategoryZodSchema),
  CategoriesController.updateCategory
);

router.delete(
  '/:id',
  validateRequest(CategoriesValidation.deleteCategoryZodSchema),
  CategoriesController.deleteCategory
);

export default router;
