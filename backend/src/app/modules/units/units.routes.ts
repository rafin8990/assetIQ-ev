import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { UnitsController } from './units.controller';
import { UnitsValidation } from './units.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(UnitsValidation.createUnitZodSchema),
  UnitsController.createUnit
);

router.get(
  '/',
  validateRequest(UnitsValidation.getAllUnitsZodSchema),
  UnitsController.getAllUnits
);

router.get(
  '/:id',
  validateRequest(UnitsValidation.getSingleUnitZodSchema),
  UnitsController.getSingleUnit
);

router.patch(
  '/:id',
  validateRequest(UnitsValidation.updateUnitZodSchema),
  UnitsController.updateUnit
);

router.delete(
  '/:id',
  validateRequest(UnitsValidation.deleteUnitZodSchema),
  UnitsController.deleteUnit
);

export default router;
