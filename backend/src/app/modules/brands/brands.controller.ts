import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { BRANDS_FILTERABLE_FIELDS } from './brands.constant';
import { IBrand } from './brands.interface';
import { BrandsService } from './brands.service';

const createBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandsService.createBrand(req.body);

  sendResponse<IBrand>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Brand created successfully',
    data: result,
  });
});

const getAllBrands = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, BRANDS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const result = await BrandsService.getAllBrands(filters, options);

  sendResponse<IBrand[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandsService.getSingleBrand(Number(req.params.id));

  sendResponse<IBrand>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand retrieved successfully',
    data: result,
  });
});

const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandsService.updateBrand(
    Number(req.params.id),
    req.body
  );

  sendResponse<IBrand>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand updated successfully',
    data: result,
  });
});

const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandsService.deleteBrand(Number(req.params.id));

  sendResponse<IBrand>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand deleted successfully',
    data: result,
  });
});

export const BrandsController = {
  createBrand,
  getAllBrands,
  getSingleBrand,
  updateBrand,
  deleteBrand,
};
