import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getVendorImagePublicPath } from '../../middlewares/uploadVendorImage';
import { VENDORS_FILTERABLE_FIELDS } from './vendors.constant';
import {
  parseCreateVendorFormBody,
  parseUpdateVendorFormBody,
} from './vendors.helpers';
import { IVendor } from './vendors.interface';
import { VendorsService } from './vendors.service';

const mapUploadedImage = (file?: Express.Multer.File | null) =>
  file ? getVendorImagePublicPath(file.filename) : undefined;

const handleValidationError = (res: Response, error: ZodError) =>
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: 'Validation error',
    errorMessages: error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });

const createVendor = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseCreateVendorFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  const imagePath = mapUploadedImage(req.file);
  const result = await VendorsService.createVendor(payload, imagePath ?? null);

  sendResponse<IVendor>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Vendor created successfully',
    data: result,
  });
});

const getAllVendors = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, VENDORS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const result = await VendorsService.getAllVendors(filters, options);

  sendResponse<IVendor[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendors retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorsService.getSingleVendor(Number(req.params.id));

  sendResponse<IVendor>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor retrieved successfully',
    data: result,
  });
});

const updateVendor = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseUpdateVendorFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  const imagePath = mapUploadedImage(req.file);
  const result = await VendorsService.updateVendor(
    Number(req.params.id),
    payload,
    imagePath
  );

  sendResponse<IVendor>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor updated successfully',
    data: result,
  });
});

const deleteVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorsService.deleteVendor(Number(req.params.id));

  sendResponse<IVendor>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor deleted successfully',
    data: result,
  });
});

export const VendorsController = {
  createVendor,
  getAllVendors,
  getSingleVendor,
  updateVendor,
  deleteVendor,
};
