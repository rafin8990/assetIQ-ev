import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { STOCKS_FILTERABLE_FIELDS } from './stocks.constant';
import { IStockWithRelations } from './stocks.interface';
import { StocksService } from './stocks.service';

const addManualStock = catchAsync(async (req: Request, res: Response) => {
  const result = await StocksService.addManualStock(req.body);

  sendResponse<IStockWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Stock added successfully',
    data: result,
  });
});

const bulkImportStock = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Import file is required',
      errorMessages: [
        {
          path: 'file',
          message: 'Import file is required (.xlsx, .xls, .csv)',
        },
      ],
    });
  }

  const result = await StocksService.bulkImportStock(req.file.buffer);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Import completed: ${result.processed} processed, ${result.failed} failed`,
    data: result,
  });
});

const downloadBulkImportTemplate = catchAsync(
  async (_req: Request, res: Response) => {
    const buffer = StocksService.generateBulkImportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="stock-import-template.xlsx"'
    );
    res.status(httpStatus.OK).send(buffer);
  }
);

const getAllStocks = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, STOCKS_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    itemId:
      rawFilters.itemId !== undefined ? Number(rawFilters.itemId) : undefined,
  };

  const result = await StocksService.getAllStocks(filters, options);

  sendResponse<IStockWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stocks retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleStock = catchAsync(async (req: Request, res: Response) => {
  const result = await StocksService.getSingleStock(Number(req.params.id));

  sendResponse<IStockWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock retrieved successfully',
    data: result,
  });
});

const updateStock = catchAsync(async (req: Request, res: Response) => {
  const result = await StocksService.updateStock(
    Number(req.params.id),
    req.body
  );

  sendResponse<IStockWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock updated successfully',
    data: result,
  });
});

const deleteStock = catchAsync(async (req: Request, res: Response) => {
  const result = await StocksService.deleteStock(Number(req.params.id));

  sendResponse<IStockWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock deleted successfully',
    data: result,
  });
});

export const StocksController = {
  addManualStock,
  bulkImportStock,
  downloadBulkImportTemplate,
  getAllStocks,
  getSingleStock,
  updateStock,
  deleteStock,
};
