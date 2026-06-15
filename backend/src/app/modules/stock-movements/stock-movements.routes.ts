import express from 'express';

import { auth, requirePermission } from '../../middlewares/auth';
import {
  PERMISSION_ACTION_STOCK_MOVEMENTS_APPROVE,
  PERMISSION_ACTION_STOCK_MOVEMENTS_CONFIRM,
  PERMISSION_ACTION_STOCK_MOVEMENTS_READY,
  PERMISSION_ACTION_STOCK_MOVEMENTS_TRANSFER,
} from '../permissions/permissions.constant';
import validateRequest from '../../middlewares/validateRequest';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsValidation } from './stock-movements.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(StockMovementsValidation.createStockMovementZodSchema),
  StockMovementsController.createStockMovement
);

router.get(
  '/',
  validateRequest(StockMovementsValidation.getAllStockMovementsZodSchema),
  StockMovementsController.getAllStockMovements
);

router.get(
  '/:id',
  validateRequest(StockMovementsValidation.getSingleStockMovementZodSchema),
  StockMovementsController.getSingleStockMovement
);

router.patch(
  '/:id/approve',
  auth,
  requirePermission(PERMISSION_ACTION_STOCK_MOVEMENTS_APPROVE),
  validateRequest(StockMovementsValidation.approveStockMovementZodSchema),
  StockMovementsController.approveStockMovement
);

router.patch(
  '/:id/ready',
  auth,
  requirePermission(PERMISSION_ACTION_STOCK_MOVEMENTS_READY),
  validateRequest(StockMovementsValidation.readyStockMovementZodSchema),
  StockMovementsController.readyStockMovement
);

router.patch(
  '/:id/transfer',
  auth,
  requirePermission(PERMISSION_ACTION_STOCK_MOVEMENTS_TRANSFER),
  validateRequest(StockMovementsValidation.transferStockMovementZodSchema),
  StockMovementsController.transferStockMovement
);

router.patch(
  '/:id/confirm',
  auth,
  requirePermission(PERMISSION_ACTION_STOCK_MOVEMENTS_CONFIRM),
  validateRequest(StockMovementsValidation.confirmStockMovementZodSchema),
  StockMovementsController.confirmStockMovement
);

router.patch(
  '/:id/cancel',
  validateRequest(StockMovementsValidation.cancelStockMovementZodSchema),
  StockMovementsController.cancelStockMovement
);

export default router;
