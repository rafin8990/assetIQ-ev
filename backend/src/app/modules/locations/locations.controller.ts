import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { LOCATIONS_FILTERABLE_FIELDS } from './locations.constant';
import { ILocation } from './locations.interface';
import { LocationsService } from './locations.service';

const createLocation = catchAsync(async (req: Request, res: Response) => {
  const result = await LocationsService.createLocation(req.body);

  sendResponse<ILocation>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Location created successfully',
    data: result,
  });
});

const getAllLocations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, LOCATIONS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const result = await LocationsService.getAllLocations(filters, options);

  sendResponse<ILocation[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Locations retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleLocation = catchAsync(async (req: Request, res: Response) => {
  const result = await LocationsService.getSingleLocation(Number(req.params.id));

  sendResponse<ILocation>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Location retrieved successfully',
    data: result,
  });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const result = await LocationsService.updateLocation(
    Number(req.params.id),
    req.body
  );

  sendResponse<ILocation>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Location updated successfully',
    data: result,
  });
});

const deleteLocation = catchAsync(async (req: Request, res: Response) => {
  const result = await LocationsService.deleteLocation(Number(req.params.id));

  sendResponse<ILocation>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Location deleted successfully',
    data: result,
  });
});

export const LocationsController = {
  createLocation,
  getAllLocations,
  getSingleLocation,
  updateLocation,
  deleteLocation,
};
