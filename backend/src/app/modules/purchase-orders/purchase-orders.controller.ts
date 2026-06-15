import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getPurchaseOrderAttachmentPublicPath } from '../../middlewares/uploadPurchaseOrderAttachment';
import {
  PURCHASE_ORDERS_FILTERABLE_FIELDS,
  STAGING_FILTERABLE_FIELDS,
} from './purchase-orders.constant';
import {
  parseCreatePurchaseOrderFormBody,
  parseUpdatePurchaseOrderFormBody,
} from './purchase-orders.helpers';
import {
  IPurchaseOrderWithRelations,
  IStagingPurchaseOrderDetail,
  IStagingPurchaseOrderSummary,
  PurchaseOrderStatus,
  PurchaseOrderType,
} from './purchase-orders.interface';
import { PurchaseOrdersReportsService } from './purchase-orders-reports.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersStagingService } from './purchase-orders.staging.service';

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
    vendorId:
      rawFilters.vendorId !== undefined
        ? Number(rawFilters.vendorId)
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
  const approvedBy = req.user?.userId ?? Number(req.body.approved_by);

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

const getDailyReport = catchAsync(async (req: Request, res: Response) => {
  const date = String(req.query.date);
  const result = await PurchaseOrdersReportsService.getDailyReport(date);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily purchase order report retrieved successfully',
    data: result,
  });
});

const getDateRangeReport = catchAsync(async (req: Request, res: Response) => {
  const fromDate = String(req.query.fromDate);
  const toDate = String(req.query.toDate);
  const result = await PurchaseOrdersReportsService.getDateRangeReport(
    fromDate,
    toDate
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Date range purchase order report retrieved successfully',
    data: result,
  });
});

const getDuePaidReport = catchAsync(async (req: Request, res: Response) => {
  const fromDate = String(req.query.fromDate);
  const toDate = String(req.query.toDate);
  const paymentType = String(req.query.paymentType) as 'due' | 'paid';
  const result = await PurchaseOrdersReportsService.getDuePaidReport(
    fromDate,
    toDate,
    paymentType
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Due/paid purchase order report retrieved successfully',
    data: result,
  });
});

const getMonthwiseReport = catchAsync(async (req: Request, res: Response) => {
  const year = Number(req.query.year);
  const result = await PurchaseOrdersReportsService.getMonthwiseReport(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthwise purchase order report retrieved successfully',
    data: result,
  });
});

const getStagingPurchaseOrders = catchAsync(
  async (req: Request, res: Response) => {
    const rawFilters = pick(req.query, STAGING_FILTERABLE_FIELDS);
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
    };

    const result = await PurchaseOrdersStagingService.listStagingPurchaseOrders(
      filters,
      options
    );

    sendResponse<IStagingPurchaseOrderSummary[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Staging purchase orders retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }
);

const getStagingDetail = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrdersStagingService.getStagingDetail(
    Number(req.params.id)
  );

  sendResponse<IStagingPurchaseOrderDetail>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staging purchase order detail retrieved successfully',
    data: result,
  });
});

const recordStagingReceipt = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await PurchaseOrdersStagingService.recordStagingReceipt(
    Number(req.params.id),
    userId,
    req.body.items
  );

  sendResponse<IStagingPurchaseOrderDetail>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Staging receipt recorded successfully',
    data: result,
  });
});

const returnToVendor = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await PurchaseOrdersStagingService.returnToVendor(
    Number(req.params.id),
    userId,
    req.body.items
  );

  sendResponse<IStagingPurchaseOrderDetail>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Items returned to vendor successfully',
    data: result,
  });
});

const acceptStagingToStock = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await PurchaseOrdersStagingService.acceptStagingToStock(
    Number(req.params.id),
    userId,
    req.body
  );

  sendResponse<IStagingPurchaseOrderDetail>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Items accepted to stock successfully',
    data: result,
  });
});

const getVendorReturns = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseOrdersStagingService.getVendorReturns(
    Number(req.params.id)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor returns retrieved successfully',
    data: result,
  });
});

export const PurchaseOrdersController = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getDailyReport,
  getDateRangeReport,
  getDuePaidReport,
  getMonthwiseReport,
  getStagingPurchaseOrders,
  getStagingDetail,
  recordStagingReceipt,
  returnToVendor,
  acceptStagingToStock,
  getVendorReturns,
  getSinglePurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  cancelPurchaseOrder,
};
