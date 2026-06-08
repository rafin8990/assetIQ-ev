import express from 'express';

import { ENUM_USER_ROLE } from '../../../enums/user';
import { auth, requireRole } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';
import validateRequest from '../../middlewares/validateRequest';
import { StocksController } from './stocks.controller';
import { StocksValidation } from './stocks.validation';

const router = express.Router();

const superAdminOnly = [ENUM_USER_ROLE.SUPER_ADMIN];

router.post(
  '/manual',
  auth,
  requireRole(superAdminOnly),
  validateRequest(StocksValidation.createManualStockZodSchema),
  StocksController.addManualStock
);

router.get(
  '/bulk-import/template',
  auth,
  requireRole(superAdminOnly),
  StocksController.downloadBulkImportTemplate
);

router.post(
  '/bulk-import',
  auth,
  requireRole(superAdminOnly),
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
  auth,
  requireRole(superAdminOnly),
  validateRequest(StocksValidation.updateStockZodSchema),
  StocksController.updateStock
);

router.delete(
  '/:id',
  auth,
  requireRole(superAdminOnly),
  validateRequest(StocksValidation.deleteStockZodSchema),
  StocksController.deleteStock
);

router.get(
  '/:id',
  validateRequest(StocksValidation.getSingleStockZodSchema),
  StocksController.getSingleStock
);

export default router;
