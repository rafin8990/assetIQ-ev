import express from 'express';

import { upload } from '../../middlewares/upload';
import { uploadItemImages } from '../../middlewares/uploadImage';
import validateRequest from '../../middlewares/validateRequest';
import { ItemsController } from './items.controller';
import { ItemsValidation } from './items.validation';

const router = express.Router();

router.get(
  '/bulk-import/template',
  ItemsController.downloadBulkImportTemplate
);

router.post(
  '/bulk-import',
  upload.single('file'),
  ItemsController.bulkImportItems
);

router.post(
  '/',
  uploadItemImages.array('images', 10),
  ItemsController.createItem
);

router.get(
  '/',
  validateRequest(ItemsValidation.getAllItemsZodSchema),
  ItemsController.getAllItems
);

router.get(
  '/:id',
  validateRequest(ItemsValidation.getSingleItemZodSchema),
  ItemsController.getSingleItem
);

router.patch(
  '/:id',
  validateRequest(ItemsValidation.updateItemZodSchema),
  ItemsController.updateItem
);

router.delete(
  '/:id',
  validateRequest(ItemsValidation.deleteItemZodSchema),
  ItemsController.deleteItem
);

router.post(
  '/:id/images',
  uploadItemImages.array('images', 10),
  ItemsController.addItemImages
);

router.delete(
  '/:id/images/:imageId',
  validateRequest(ItemsValidation.deleteItemImageZodSchema),
  ItemsController.deleteItemImage
);

export default router;
