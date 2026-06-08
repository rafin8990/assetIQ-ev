import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const uploadDir = path.join(__dirname, '../../public/uploads/requisitions');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const attachmentFilter = (
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
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'pdf',
    'xls',
    'xlsx',
    'csv',
    'doc',
    'docx',
  ];

  if (
    allowedMimes.includes(file.mimetype) ||
    (ext && allowedExtensions.includes(ext))
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed: images, PDF, Excel (.xls, .xlsx), CSV, Word (.doc, .docx)'
      )
    );
  }
};

export const uploadRequisitionAttachment = multer({
  storage,
  fileFilter: attachmentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

export const getRequisitionAttachmentPublicPath = (filename: string) =>
  `/uploads/requisitions/${filename}`;

export const getRequisitionAttachmentDiskPath = (attachmentPath: string) => {
  const filename = path.basename(attachmentPath);
  return path.join(uploadDir, filename);
};
