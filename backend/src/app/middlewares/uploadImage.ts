import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import {
  getUploadDir,
  getUploadDiskPath,
  getUploadPublicPath,
} from '../../utils/uploadPaths';

const uploadDir = getUploadDir('items');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const imageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  if (
    allowedMimes.includes(file.mimetype) ||
    (ext && allowedExtensions.includes(ext))
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only image files (.jpg, .jpeg, .png, .webp, .gif) are allowed'
      )
    );
  }
};

export const uploadItemImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

export const getItemImagePublicPath = (filename: string) =>
  getUploadPublicPath('items', filename);

export const getItemImageDiskPath = (imagePath: string) =>
  getUploadDiskPath('items', imagePath);
