import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { SUB_CATEGORIES_FILTERABLE_FIELDS } from './sub-categories.constant';
import { ISubCategoryWithCategory } from './sub-categories.interface';
import { SubCategoriesService } from './sub-categories.service';

const createSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SubCategoriesService.createSubCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Sub category created successfully',
    data: result,
  });
});

const getAllSubCategories = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, SUB_CATEGORIES_FILTERABLE_FIELDS);
  const options = pick(req.query, paginationFields);
  const filters = {
    searchTerm:
      typeof rawFilters.searchTerm === 'string'
        ? rawFilters.searchTerm
        : undefined,
    categoryId:
      rawFilters.categoryId !== undefined
        ? Number(rawFilters.categoryId)
        : undefined,
  };

  const result = await SubCategoriesService.getAllSubCategories(
    filters,
    options
  );

  sendResponse<ISubCategoryWithCategory[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SubCategoriesService.getSingleSubCategory(
    Number(req.params.id)
  );

  sendResponse<ISubCategoryWithCategory>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub category retrieved successfully',
    data: result,
  });
});

const updateSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SubCategoriesService.updateSubCategory(
    Number(req.params.id),
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub category updated successfully',
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await SubCategoriesService.deleteSubCategory(
    Number(req.params.id)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub category deleted successfully',
    data: result,
  });
});

export const SubCategoriesController = {
  createSubCategory,
  getAllSubCategories,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
