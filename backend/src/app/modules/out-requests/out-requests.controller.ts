import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { OUT_REQUESTS_FILTERABLE_FIELDS } from './out-requests.constant';
import {
  IOutRequestWithRelations,
  OutRequestStatus,
} from './out-requests.interface';
import { OutRequestsReportsService } from './out-requests-reports.service';
import { OutRequestsService } from './out-requests.service';

const getAllOutRequests = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, [...OUT_REQUESTS_FILTERABLE_FIELDS]);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    status:
      typeof rawFilters.status === 'string'
        ? (rawFilters.status as OutRequestStatus)
        : undefined,
    requestedBy:
      rawFilters.requestedBy !== undefined
        ? Number(rawFilters.requestedBy)
        : undefined,
  };

  const result = await OutRequestsService.getAllOutRequests(filters, options);

  sendResponse<IOutRequestWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out requests retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleOutRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await OutRequestsService.getSingleOutRequest(
    Number(req.params.id)
  );

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request retrieved successfully',
    data: result,
  });
});

const createOutRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await OutRequestsService.createOutRequest(req.body);

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Out request created successfully',
    data: result,
  });
});

const updateOutRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await OutRequestsService.updateOutRequest(
    Number(req.params.id),
    req.body
  );

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request updated successfully',
    data: result,
  });
});

const deleteOutRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  await OutRequestsService.deleteOutRequest(Number(req.params.id), userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request deleted successfully',
    data: null,
  });
});

const approveOutRequest = catchAsync(async (req: Request, res: Response) => {
  const approvedBy = req.user?.userId;

  if (!approvedBy) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const result = await OutRequestsService.approveOutRequest(
    Number(req.params.id),
    approvedBy
  );

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request approved successfully',
    data: result,
  });
});

const cancelOutRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await OutRequestsService.cancelOutRequest(
    Number(req.params.id)
  );

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request cancelled successfully',
    data: result,
  });
});

const processOutRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await OutRequestsService.processOutRequest(
    Number(req.params.id),
    req.body
  );

  sendResponse<IOutRequestWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Out request processed successfully',
    data: result,
  });
});

const getDailyReport = catchAsync(async (req: Request, res: Response) => {
  const date = String(req.query.date);
  const result = await OutRequestsReportsService.getDailyReport(date);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Daily out request report retrieved successfully',
    data: result,
  });
});

const getDateRangeReport = catchAsync(async (req: Request, res: Response) => {
  const fromDate = String(req.query.fromDate);
  const toDate = String(req.query.toDate);
  const result = await OutRequestsReportsService.getDateRangeReport(
    fromDate,
    toDate
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Date range out request report retrieved successfully',
    data: result,
  });
});

const getMonthwiseReport = catchAsync(async (req: Request, res: Response) => {
  const year = Number(req.query.year);
  const result = await OutRequestsReportsService.getMonthwiseReport(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthwise out request report retrieved successfully',
    data: result,
  });
});

const getUserWiseReport = catchAsync(async (req: Request, res: Response) => {
  const fromDate = String(req.query.fromDate);
  const toDate = String(req.query.toDate);
  const userId =
    req.query.userId !== undefined ? Number(req.query.userId) : undefined;
  const result = await OutRequestsReportsService.getUserWiseReport(
    fromDate,
    toDate,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User wise out request report retrieved successfully',
    data: result,
  });
});

export const OutRequestsController = {
  getAllOutRequests,
  getSingleOutRequest,
  createOutRequest,
  updateOutRequest,
  deleteOutRequest,
  approveOutRequest,
  cancelOutRequest,
  processOutRequest,
  getDailyReport,
  getDateRangeReport,
  getMonthwiseReport,
  getUserWiseReport,
};
