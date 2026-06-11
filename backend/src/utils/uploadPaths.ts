import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

export const getPublicDir = () => publicDir;

export const getUploadDir = (subfolder: string) => {
  const uploadDir = path.join(publicDir, 'uploads', subfolder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
};

export const getUploadPublicPath = (subfolder: string, filename: string) =>
  `/uploads/${subfolder}/${filename}`;

export const getUploadDiskPath = (subfolder: string, filePath: string) => {
  const filename = path.basename(filePath);
  return path.join(getUploadDir(subfolder), filename);
};
