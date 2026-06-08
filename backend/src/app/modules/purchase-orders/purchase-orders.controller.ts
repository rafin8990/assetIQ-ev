import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getPurchaseOrderAttachmentPublicPath } from '../../middlewares/uploadPurchaseOrderAttachment';
import { PURCHASE_ORDERS_FILTERABLE_FIELDS } from './purchase-orders.constant';
import {
  parseCreatePurchaseOrderFormBody,
  parseUpdatePurchaseOrderFormBody,
} from './purchase-orders.helpers';
import {
  IPurchaseOrderWithRelations,
  PurchaseOrderStatus,
  PurchaseOrderType,
} from './purchase-orders.interface';
import { PurchaseOrdersService } from './purchase-orders.service';

const mapUploadedAttachment = (file?: Express.Multer.File | null) =>
  file ? getPurchaseOrderAttachmentPublicPath(file.filename) : undefined;

const handleValidationError = (res: Response, error: ZodError) =>
  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: 'Validation error',
    errorMessages: error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  });

const createPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseCreatePurchaseOrderFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  const attachmentPath = mapUploadedAttachment(req.file);
  const result = await PurchaseOrdersService.createPurchaseOrder(
    payload,
    attachmentPath ?? null
  );

  sendResponse<IPurchaseOrderWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Purchase order created successfully',
    data: result,
  });
});

const getAllPurchaseOrders = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, PURCHASE_ORDERS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    status:
      typeof rawFilters.status === 'string'
        ? (rawFilters.status as PurchaseOrderStatus)
        : undefined,
    orderType:
      typeof rawFilters.orderType === 'string'
        ? (rawFilters.orderType as PurchaseOrderType)
        : undefined,
    createdBy:
      rawFilters.createdBy !== undefined
        ? Number(rawFilters.createdBy)
        : undefined,
  };

  const result = await PurchaseOrdersService.getAllPurchaseOrders(
    filters,
    options
  );

  sendResponse<IPurchaseOrderWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSinglePurchaseOrder = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PurchaseOrdersService.getSinglePurchaseOrder(
      Number(req.params.id)
    );

    sendResponse<IPurchaseOrderWithRelations>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Purchase order retrieved successfully',
      data: result,
    });
  }
);

const updatePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseUpdatePurchaseOrderFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(res, error);
    }
    throw error;
  }

  const attachmentPath = mapUploadedAttachment(req.file);
  const result = await PurchaseOrdersService.updatePurchaseOrder(
    Number(req.params.id),
    payload,
    attachmentPath
  );

  sendResponse<IPurchaseOrderWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order updated successfully',
    data: result,
  });
});

const deletePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  await PurchaseOrdersService.deletePurchaseOrder(Number(req.params.id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order deleted successfully',
    data: null,
  });
});

const approvePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const approvedBy = Number(req.body.approved_by);

  if (!approvedBy || Number.isNaN(approvedBy)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'approved_by is required',
      errorMessages: [
        { path: 'approved_by', message: 'approved_by must be a valid user id' },
      ],
    });
  }

  const result = await PurchaseOrdersService.approvePurchaseOrder(
    Number(req.params.id),
    approvedBy
  );

  sendResponse<IPurchaseOrderWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order approved successfully',
    data: result,
  });
});

const cancelPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrdersService.cancelPurchaseOrder(
    Number(req.params.id)
  );

  sendResponse<IPurchaseOrderWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order cancelled successfully',
    data: result,
  });
});

const receivePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const receivedBy = Number(req.body.received_by);

  if (!receivedBy || Number.isNaN(receivedBy)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'received_by is required',
      errorMessages: [
        { path: 'received_by', message: 'received_by must be a valid user id' },
      ],
    });
  }

  const result = await PurchaseOrdersService.receivePurchaseOrder(
    Number(req.params.id),
    receivedBy
  );

  sendResponse<IPurchaseOrderWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Purchase order marked as received successfully',
    data: result,
  });
});

export const PurchaseOrdersController = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getSinglePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  receivePurchaseOrder,
};
