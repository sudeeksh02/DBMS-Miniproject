import fs from 'fs';
import path from 'path';

// Local File Storage Service for Legal Documents & Evidence
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Upload policy: court documents are PDFs, scans/photos, Word files or plain text
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

/** Returns an error message if the file violates the upload policy, otherwise null. */
export function validateUpload(file: File): string | null {
  if (file.size === 0) return 'The uploaded file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return 'File exceeds the 10 MB upload limit.';
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type '${file.type || 'unknown'}' is not allowed. Upload PDF, JPEG, PNG, DOC/DOCX or TXT.`;
  }
  return null;
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

  const rawExt = path.extname(path.basename(file.name));
  const ext = /^\.[a-zA-Z0-9]{1,8}$/.test(rawExt) ? rawExt.toLowerCase() : '.bin';
  const sanitizedBase = path.basename(file.name, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_');
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
