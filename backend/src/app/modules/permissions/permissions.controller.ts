import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IPermissionsRegistry } from './permissions.interface';
import { PermissionsService } from './permissions.service';

const getPermissionsRegistry = catchAsync(
  async (_req: Request, res: Response) => {
    const result = PermissionsService.getPermissionsRegistry();

    sendResponse<IPermissionsRegistry>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Permissions registry retrieved successfully',
      data: result,
    });
  }
);

const getUserPermissions = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const result = await PermissionsService.getUserPermissions(userId);

  sendResponse<string[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User permissions retrieved successfully',
    data: result,
  });
});

const setUserPermissions = catchAsync(async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const result = await PermissionsService.setUserPermissions(userId, req.body);

  sendResponse<string[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User permissions updated successfully',
    data: result,
  });
});

export const PermissionsController = {
  getPermissionsRegistry,
  getUserPermissions,
  setUserPermissions,
};
