import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import { PERMISSION_ACTION_MANAGE_STOCK } from '../permissions/permissions.constant';
import validateRequest from '../../middlewares/validateRequest';
import { InventoryController } from './inventory.controller';
import { InventoryValidation } from './inventory.validation';

const router = express.Router();

router.get(
  '/reports/daily-movement',
  validateRequest(InventoryValidation.getDailyMovementReportZodSchema),
  InventoryController.getDailyMovementReport
);

router.get(
  '/reports/date-range-movement',
  validateRequest(InventoryValidation.getDateRangeMovementReportZodSchema),
  InventoryController.getDateRangeMovementReport
);

router.get(
  '/reports/user-wise-movement',
  validateRequest(InventoryValidation.getUserWiseMovementReportZodSchema),
  InventoryController.getUserWiseMovementReport
);

router.get(
  '/reports/main-stock-update',
  validateRequest(InventoryValidation.getMainStockUpdateReportZodSchema),
  InventoryController.getMainStockUpdateReport
);

router.get(
  '/reports/monthwise-movement',
  validateRequest(InventoryValidation.getMonthwiseMovementReportZodSchema),
  InventoryController.getMonthwiseMovementReport
);

router.get(
  '/location-stock',
  validateRequest(InventoryValidation.getLocationStockZodSchema),
  InventoryController.getLocationStock
);

router.get(
  '/total-stock',
  validateRequest(InventoryValidation.getTotalStockZodSchema),
  InventoryController.getTotalStock
);

router.get(
  '/lots',
  validateRequest(InventoryValidation.getLotsZodSchema),
  InventoryController.getLots
);

router.get(
  '/total-stock/:itemId/breakdown',
  validateRequest(InventoryValidation.getTotalStockBreakdownZodSchema),
  InventoryController.getTotalStockBreakdown
);

router.post(
  '/manual-lot',
  auth,
  requirePermission(PERMISSION_ACTION_MANAGE_STOCK),
  validateRequest(InventoryValidation.addManualLotZodSchema),
  InventoryController.addManualLot
);

export default router;
