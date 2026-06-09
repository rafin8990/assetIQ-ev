import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import { PERMISSION_ACTION_MANAGE_STOCK } from '../permissions/permissions.constant';
import { upload } from '../../middlewares/upload';
import validateRequest from '../../middlewares/validateRequest';
import { StocksController } from './stocks.controller';
import { StocksValidation } from './stocks.validation';

const router = express.Router();

const manageStock = [auth, requirePermission(PERMISSION_ACTION_MANAGE_STOCK)];

router.post(
  '/manual',
  ...manageStock,
  validateRequest(StocksValidation.createManualStockZodSchema),
  StocksController.addManualStock
);

router.get(
  '/bulk-import/template',
  ...manageStock,
  StocksController.downloadBulkImportTemplate
);

router.post(
  '/bulk-import',
  ...manageStock,
  upload.single('file'),
  StocksController.bulkImportStock
);

router.get(
  '/',
  validateRequest(StocksValidation.getAllStocksZodSchema),
  StocksController.getAllStocks
);

router.patch(
  '/:id',
  ...manageStock,
  validateRequest(StocksValidation.updateStockZodSchema),
  StocksController.updateStock
);

router.delete(
  '/:id',
  ...manageStock,
  validateRequest(StocksValidation.deleteStockZodSchema),
  StocksController.deleteStock
);

router.get(
  '/:id',
  validateRequest(StocksValidation.getSingleStockZodSchema),
  StocksController.getSingleStock
);

export default router;
