import fs from 'fs';
import path from 'path';

// Local File Storage Service for Legal Documents & Evidence
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface StoredFile {
  originalName: string;
  savedName: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
}

export async function saveUploadedFile(file: File): Promise<StoredFile> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || '.bin';
  const sanitizedBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${sanitizedBase}_${Date.now()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  fs.writeFileSync(filePath, buffer);

  return {
    originalName: file.name,
    savedName: uniqueName,
    storagePath: `uploads/${uniqueName}`,
    sizeBytes: buffer.length,
    mimeType: file.type || 'application/octet-stream',
  };
}

export function getFileBuffer(storagePath: string): { buffer: Buffer; fileName: string } | null {
  const fileName = path.basename(storagePath);
  const resolved = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return {
    buffer: fs.readFileSync(resolved),
    fileName: path.basename(resolved),
  };
}
