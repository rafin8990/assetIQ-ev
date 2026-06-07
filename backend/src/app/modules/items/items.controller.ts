import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';

import { paginationFields } from '../../../constants/pagination';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { getItemImagePublicPath } from '../../middlewares/uploadImage';
import { ITEMS_FILTERABLE_FIELDS } from './items.constant';
import { parseItemFormBody } from './items.helpers';
import { IItemWithRelations } from './items.interface';
import { ItemsService } from './items.service';

const mapUploadedImages = (files?: Express.Multer.File[]) =>
  (files ?? []).map(file => getItemImagePublicPath(file.filename));

const createItem = catchAsync(async (req: Request, res: Response) => {
  let payload;

  try {
    payload = parseItemFormBody(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Validation error',
        errorMessages: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    throw error;
  }

  const imagePaths = mapUploadedImages(
    req.files as Express.Multer.File[] | undefined
  );
  const result = await ItemsService.createItem(payload, imagePaths);

  sendResponse<IItemWithRelations>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Item created successfully',
    data: result,
  });
});

const getAllItems = catchAsync(async (req: Request, res: Response) => {
  const rawFilters = pick(req.query, ITEMS_FILTERABLE_FIELDS);
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
    subCategoryId:
      rawFilters.subCategoryId !== undefined
        ? Number(rawFilters.subCategoryId)
        : undefined,
    brandId:
      rawFilters.brandId !== undefined
        ? Number(rawFilters.brandId)
        : undefined,
  };

  const result = await ItemsService.getAllItems(filters, options);

  sendResponse<IItemWithRelations[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Items retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSingleItem = catchAsync(async (req: Request, res: Response) => {
  const result = await ItemsService.getSingleItem(Number(req.params.id));

  sendResponse<IItemWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item retrieved successfully',
    data: result,
  });
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
  const result = await ItemsService.updateItem(
    Number(req.params.id),
    req.body
  );

  sendResponse<IItemWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item updated successfully',
    data: result,
  });
});

const deleteItem = catchAsync(async (req: Request, res: Response) => {
  await ItemsService.deleteItem(Number(req.params.id));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item deleted successfully',
    data: null,
  });
});

const addItemImages = catchAsync(async (req: Request, res: Response) => {
  const imagePaths = mapUploadedImages(
    req.files as Express.Multer.File[] | undefined
  );

  if (!imagePaths.length) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'At least one image is required',
      errorMessages: [
        { path: 'images', message: 'At least one image is required' },
      ],
    });
  }

  const result = await ItemsService.addItemImages(
    Number(req.params.id),
    imagePaths
  );

  sendResponse<IItemWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item images added successfully',
    data: result,
  });
});

const deleteItemImage = catchAsync(async (req: Request, res: Response) => {
  const result = await ItemsService.deleteItemImage(
    Number(req.params.id),
    Number(req.params.imageId)
  );

  sendResponse<IItemWithRelations>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item image deleted successfully',
    data: result,
  });
});

const bulkImportItems = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Excel file is required',
      errorMessages: [
        { path: 'file', message: 'Excel file is required (.xlsx, .xls)' },
      ],
    });
  }

  const result = await ItemsService.bulkImportItems(req.file.buffer);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Import completed: ${result.created} created, ${result.failed} failed`,
    data: result,
  });
});

const downloadBulkImportTemplate = catchAsync(
  async (_req: Request, res: Response) => {
    const buffer = ItemsService.generateBulkImportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="items-import-template.xlsx"'
    );
    res.status(httpStatus.OK).send(buffer);
  }
);

export const ItemsController = {
  createItem,
  getAllItems,
  getSingleItem,
  updateItem,
  deleteItem,
  addItemImages,
  deleteItemImage,
  bulkImportItems,
  downloadBulkImportTemplate,
};
