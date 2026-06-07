import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { UNITS_FILTERABLE_FIELDS } from './units.constant';
import { IUnit } from './units.interface';
import { UnitsService } from './units.service';

const createUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await UnitsService.createUnit(req.body);

  sendResponse<IUnit>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Unit created successfully',
    data: result,
  });
});

const getAllUnits = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, UNITS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const result = await UnitsService.getAllUnits(filters, options);

  sendResponse<IUnit[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Units retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await UnitsService.getSingleUnit(Number(req.params.id));

  sendResponse<IUnit>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unit retrieved successfully',
    data: result,
  });
});

const updateUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await UnitsService.updateUnit(
    Number(req.params.id),
    req.body
  );

  sendResponse<IUnit>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unit updated successfully',
    data: result,
  });
});

const deleteUnit = catchAsync(async (req: Request, res: Response) => {
  const result = await UnitsService.deleteUnit(Number(req.params.id));

  sendResponse<IUnit>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Unit deleted successfully',
    data: result,
  });
});

export const UnitsController = {
  createUnit,
  getAllUnits,
  getSingleUnit,
  updateUnit,
  deleteUnit,
};
