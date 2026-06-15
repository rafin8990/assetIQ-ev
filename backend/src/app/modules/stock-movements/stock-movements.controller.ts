import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { STOCK_MOVEMENTS_FILTERABLE_FIELDS } from './stock-movements.constant';
import {
  IStockMovementWithRelations,
  StockMovementStatus,
} from './stock-movements.interface';
import { StockMovementsService } from './stock-movements.service';

const parseFilters = (req: Request) => {
  const raw = pick(req.query, [...STOCK_MOVEMENTS_FILTERABLE_FIELDS]);
  return {
    searchTerm:
      typeof raw.searchTerm === 'string' ? raw.searchTerm : undefined,
    status:
      typeof raw.status === 'string'
        ? (raw.status as StockMovementStatus)
        : undefined,
    sourceLocationId:
      raw.sourceLocationId !== undefined
        ? Number(raw.sourceLocationId)
        : undefined,
    destinationLocationId:
      raw.destinationLocationId !== undefined
        ? Number(raw.destinationLocationId)
        : undefined,
  };
};

const getAllStockMovements = catchAsync(async (req: Request, res: Response) => {
  const filters = parseFilters(req);
  const options = pick(req.query, paginationFields);
  const result = await StockMovementsService.getAllStockMovements(
    filters,
    options
  );

  sendResponse<IStockMovementWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movements retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleStockMovement = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StockMovementsService.getSingleStockMovement(
      Number(req.params.id)
    );

    sendResponse<IStockMovementWithRelations>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Stock movement retrieved successfully',
      data: result,
    });
  }
);

const createStockMovement = catchAsync(async (req: Request, res: Response) => {
  const result = await StockMovementsService.createStockMovement(req.body);

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Stock movement created successfully',
    data: result,
  });
});

const approveStockMovement = catchAsync(async (req: Request, res: Response) => {
  const approvedBy = req.user?.userId;

  if (!approvedBy) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await StockMovementsService.approveStockMovement(
    Number(req.params.id),
    approvedBy
  );

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movement approved successfully',
    data: result,
  });
});

const readyStockMovement = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await StockMovementsService.readyStockMovement(
    Number(req.params.id),
    userId,
    req.body
  );

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movement marked ready successfully',
    data: result,
  });
});

const transferStockMovement = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await StockMovementsService.transferStockMovement(
    Number(req.params.id),
    userId,
    req.body
  );

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movement transferred successfully',
    data: result,
  });
});

const confirmStockMovement = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await StockMovementsService.confirmStockMovement(
    Number(req.params.id),
    userId,
    req.body
  );

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movement confirmed successfully',
    data: result,
  });
});

const cancelStockMovement = catchAsync(async (req: Request, res: Response) => {
  const result = await StockMovementsService.cancelStockMovement(
    Number(req.params.id)
  );

  sendResponse<IStockMovementWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stock movement cancelled successfully',
    data: result,
  });
});

export const StockMovementsController = {
  getAllStockMovements,
  getSingleStockMovement,
  createStockMovement,
  approveStockMovement,
  readyStockMovement,
  transferStockMovement,
  confirmStockMovement,
  cancelStockMovement,
};
