import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { INVENTORY_FILTERABLE_FIELDS } from './inventory.constant';
import { InventoryReportsService } from './inventory-reports.service';
import { InventoryService } from './inventory.service';

const parseFilters = (req: Request) => {
  const raw = pick(req.query, INVENTORY_FILTERABLE_FIELDS);
  return {
    searchTerm:
      typeof raw.searchTerm === 'string' ? raw.searchTerm : undefined,
    locationId:
      raw.locationId !== undefined ? Number(raw.locationId) : undefined,
    itemId: raw.itemId !== undefined ? Number(raw.itemId) : undefined,
    vendorId: raw.vendorId !== undefined ? Number(raw.vendorId) : undefined,
  };
};

const getLocationStock = catchAsync(async (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const options = pick(req.query, paginationFields);
  const result = await InventoryService.getLocationStock(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Location stock retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getTotalStock = catchAsync(async (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const options = pick(req.query, paginationFields);
  const result = await InventoryService.getTotalStock(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Total stock retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getLots = catchAsync(async (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const result = await InventoryService.getLots(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock lots retrieved successfully',
    data: result,
  });
});

const getTotalStockBreakdown = catchAsync(
  async (req: Request, res: Response) => {
    const vendorIdRaw = req.query.vendorId;
    const vendorId =
      vendorIdRaw === 'null'
        ? null
        : vendorIdRaw !== undefined
          ? Number(vendorIdRaw)
          : undefined;

    const result = await InventoryService.getTotalStockLocationBreakdown(
      Number(req.params.itemId),
      vendorId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Total stock location breakdown retrieved successfully',
      data: result,
    });
  }
);

const addManualLot = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryService.addManualLot(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Stock lot added successfully',
    data: result,
  });
});

const getDailyMovementReport = catchAsync(async (req: Request, res: Response) => {
  const date = String(req.query.date);
  const result = await InventoryReportsService.getDailyMovementReport(date);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily movement report retrieved successfully',
    data: result,
  });
});

const getDateRangeMovementReport = catchAsync(
  async (req: Request, res: Response) => {
    const fromDate = String(req.query.fromDate);
    const toDate = String(req.query.toDate);
    const result = await InventoryReportsService.getDateRangeMovementReport(
      fromDate,
      toDate
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Date range movement report retrieved successfully',
      data: result,
    });
  }
);

const getMonthwiseMovementReport = catchAsync(
  async (req: Request, res: Response) => {
    const year = Number(req.query.year);
    const result = await InventoryReportsService.getMonthwiseMovementReport(year);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Monthwise movement report retrieved successfully',
      data: result,
    });
  }
);

const getUserWiseMovementReport = catchAsync(
  async (req: Request, res: Response) => {
    const fromDate = String(req.query.fromDate);
    const toDate = String(req.query.toDate);
    const userId =
      req.query.userId !== undefined ? Number(req.query.userId) : undefined;
    const result = await InventoryReportsService.getUserWiseMovementReport(
      fromDate,
      toDate,
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User wise movement report retrieved successfully',
      data: result,
    });
  }
);

const getMainStockUpdateReport = catchAsync(
  async (req: Request, res: Response) => {
    const fromDate = String(req.query.fromDate);
    const toDate = String(req.query.toDate);
    const itemId =
      req.query.itemId !== undefined ? Number(req.query.itemId) : undefined;
    const vendorId =
      req.query.vendorId !== undefined ? Number(req.query.vendorId) : undefined;
    const result = await InventoryReportsService.getMainStockUpdateReport(
      fromDate,
      toDate,
      itemId,
      vendorId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Main stock update report retrieved successfully',
      data: result,
    });
  }
);

export const InventoryController = {
  getLocationStock,
  getTotalStock,
  getLots,
  getTotalStockBreakdown,
  addManualLot,
  getDailyMovementReport,
  getDateRangeMovementReport,
  getMonthwiseMovementReport,
  getUserWiseMovementReport,
  getMainStockUpdateReport,
};
