import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';

import ApiError from '../../../errors/ApiError';
import { paginationFields } from '../../../constants/pagination';
import { PERMISSION_ACTION_APPROVE_REQUISITION } from '../permissions/permissions.constant';
import { PermissionsService } from '../permissions/permissions.service';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getRequisitionAttachmentPublicPath } from '../../middlewares/uploadRequisitionAttachment';
import { REQUISITIONS_FILTERABLE_FIELDS } from './requisitions.constant';
import {
  parseCreateRequisitionFormBody,
  parseUpdateRequisitionFormBody,
} from './requisitions.helpers';
import {
  IRequisitionWithRelations,
  RequisitionStatus,
} from './requisitions.interface';
import { RequisitionsService } from './requisitions.service';

const mapUploadedAttachment = (file?: Express.Multer.File | null) =>
  file ? getRequisitionAttachmentPublicPath(file.filename) : undefined;

const handleValidationError = (res: Response, error: ZodError) =>
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: 'Validation error',
    errorMessages: error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });

const createRequisition = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseCreateRequisitionFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  const attachmentPath = mapUploadedAttachment(req.file);
  const result = await RequisitionsService.createRequisition(
    payload,
    attachmentPath ?? null
  );

  sendResponse<IRequisitionWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Requisition created successfully',
    data: result,
  });
});

const getAllRequisitions = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, REQUISITIONS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    status:
      typeof rawFilters.status === 'string'
        ? (rawFilters.status as RequisitionStatus)
        : undefined,
    createdBy:
      rawFilters.createdBy !== undefined
        ? Number(rawFilters.createdBy)
        : undefined,
  };

  const result = await RequisitionsService.getAllRequisitions(filters, options);

  sendResponse<IRequisitionWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Requisitions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleRequisition = catchAsync(async (req: Request, res: Response) => {
  const result = await RequisitionsService.getSingleRequisition(
    Number(req.params.id)
  );

  sendResponse<IRequisitionWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Requisition retrieved successfully',
    data: result,
  });
});

const updateRequisition = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseUpdateRequisitionFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  if (payload.status === 'approved') {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    await PermissionsService.assertPermission(
      userId,
      role,
      PERMISSION_ACTION_APPROVE_REQUISITION
    );
  }

  const attachmentPath = mapUploadedAttachment(req.file);
  const result = await RequisitionsService.updateRequisition(
    Number(req.params.id),
    payload,
    attachmentPath
  );

  sendResponse<IRequisitionWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Requisition updated successfully',
    data: result,
  });
});

const deleteRequisition = catchAsync(async (req: Request, res: Response) => {
  await RequisitionsService.deleteRequisition(Number(req.params.id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Requisition deleted successfully',
    data: null,
  });
});

export const RequisitionsController = {
  createRequisition,
  getAllRequisitions,
  getSingleRequisition,
  updateRequisition,
  deleteRequisition,
};
