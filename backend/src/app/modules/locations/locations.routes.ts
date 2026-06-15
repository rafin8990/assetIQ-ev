import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import { LocationsController } from './locations.controller';
import { LocationsValidation } from './locations.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(LocationsValidation.createLocationZodSchema),
  LocationsController.createLocation
);

router.get(
  '/',
  validateRequest(LocationsValidation.getAllLocationsZodSchema),
  LocationsController.getAllLocations
);

router.get(
  '/:id',
  validateRequest(LocationsValidation.getSingleLocationZodSchema),
  LocationsController.getSingleLocation
);

router.patch(
  '/:id',
  validateRequest(LocationsValidation.updateLocationZodSchema),
  LocationsController.updateLocation
);

router.delete(
  '/:id',
  validateRequest(LocationsValidation.deleteLocationZodSchema),
  LocationsController.deleteLocation
);

export default router;
