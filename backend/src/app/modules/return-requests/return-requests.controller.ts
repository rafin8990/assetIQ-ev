import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { RETURN_REQUESTS_FILTERABLE_FIELDS } from './return-requests.constant';
import {
  IReturnRequestWithRelations,
  ReturnRequestStatus,
} from './return-requests.interface';
import { ReturnRequestsReportsService } from './return-requests-reports.service';
import { ReturnRequestsService } from './return-requests.service';

const getAllReturnRequests = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, [...RETURN_REQUESTS_FILTERABLE_FIELDS]);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    status:
      typeof rawFilters.status === 'string'
        ? (rawFilters.status as ReturnRequestStatus)
        : undefined,
    requestedBy:
      rawFilters.requestedBy !== undefined
        ? Number(rawFilters.requestedBy)
        : undefined,
    outRequestId:
      rawFilters.outRequestId !== undefined
        ? Number(rawFilters.outRequestId)
        : undefined,
  };

  const result = await ReturnRequestsService.getAllReturnRequests(
    filters,
    options
  );

  sendResponse<IReturnRequestWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Return requests retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleReturnRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ReturnRequestsService.getSingleReturnRequest(
      Number(req.params.id)
    );

    sendResponse<IReturnRequestWithRelations>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Return request retrieved successfully',
      data: result,
    });
  }
);

const createReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ReturnRequestsService.createReturnRequest(req.body);

  sendResponse<IReturnRequestWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Return request created successfully',
    data: result,
  });
});

const updateReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ReturnRequestsService.updateReturnRequest(
    Number(req.params.id),
    req.body
  );

  sendResponse<IReturnRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Return request updated successfully',
    data: result,
  });
});

const deleteReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  await ReturnRequestsService.deleteReturnRequest(Number(req.params.id), userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Return request deleted successfully',
    data: null,
  });
});

const approveReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const approvedBy = req.user?.userId;

  if (!approvedBy) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await ReturnRequestsService.approveReturnRequest(
    Number(req.params.id),
    approvedBy
  );

  sendResponse<IReturnRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Return request approved successfully',
    data: result,
  });
});

const cancelReturnRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await ReturnRequestsService.cancelReturnRequest(
    Number(req.params.id)
  );

  sendResponse<IReturnRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Return request cancelled successfully',
    data: result,
  });
});

const getDateRangeReport = catchAsync(async (req: Request, res: Response) => {
  const fromDate = String(req.query.fromDate);
  const toDate = String(req.query.toDate);
  const result = await ReturnRequestsReportsService.getDateRangeReport(
    fromDate,
    toDate
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Date range return report retrieved successfully',
    data: result,
  });
});

export const ReturnRequestsController = {
  getAllReturnRequests,
  getSingleReturnRequest,
  createReturnRequest,
  updateReturnRequest,
  deleteReturnRequest,
  approveReturnRequest,
  cancelReturnRequest,
  getDateRangeReport,
};
