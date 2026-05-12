import { ApiError } from '@trueadmin/web-core/error';
import { http } from '@/core/http/client';

export type TrueAdminFileRecord = {
  id: string | number;
  scope: string;
  ownerType: string;
  ownerId: string;
  ownerDeptId?: number | null;
  category: string;
  disk: string;
  visibility: 'public' | 'private' | string;
  name: string;
  extension?: string;
  mimeType?: string;
  size?: number;
  hash?: string;
  path: string;
  relativeUrl: string;
  absoluteUrl: string;
  url: string;
  status: string;
};

export type TrueAdminUploadOptions = {
  category?: string;
  visibility?: 'public' | 'private';
};

export type TrueAdminRemoteUploadOptions = TrueAdminUploadOptions & {
  filename?: string;
};

type TrueAdminFilePresignResult = {
  fileId: number;
  disk: string;
  method: 'PUT';
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresAt: string;
  file: TrueAdminFileRecord;
};

type TrueAdminFileCompleteInput = {
  fileId: number;
  objectKey: string;
  etag?: string;
  size?: number;
};

const USE_DIRECT_UPLOAD_REASONS = new Set(['use_presign_for_non_local_disk']);

export async function uploadTrueAdminFile(
  file: File,
  options: TrueAdminUploadOptions = {},
): Promise<TrueAdminFileRecord> {
  try {
    return await uploadMultipartFile(file, options);
  } catch (error) {
    if (!shouldUseDirectUpload(error)) {
      throw error;
    }

    return uploadDirectFile(file, options);
  }
}

async function uploadMultipartFile(
  file: File,
  options: TrueAdminUploadOptions,
): Promise<TrueAdminFileRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', options.category ?? 'attachment');
  formData.append('visibility', options.visibility ?? 'public');

  return http.Post<TrueAdminFileRecord>('/admin/files/upload', formData).send();
}

async function uploadDirectFile(
  file: File,
  options: TrueAdminUploadOptions,
): Promise<TrueAdminFileRecord> {
  const presign = await http
    .Post<TrueAdminFilePresignResult>('/admin/files/presign', {
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      category: options.category ?? 'attachment',
      visibility: options.visibility ?? 'public',
    })
    .send();

  const response = await fetch(presign.uploadUrl, {
    method: presign.method,
    headers: presign.headers,
    body: file,
  });

  if (!response.ok) {
    throw new ApiError(
      'WEB.FILE_UPLOAD_FAILED',
      response.statusText || '文件上传失败',
      response.status,
    );
  }

  return completeDirectFile({
    fileId: presign.fileId,
    objectKey: presign.objectKey,
    etag: response.headers.get('etag') ?? undefined,
    size: file.size,
  });
}

function completeDirectFile(input: TrueAdminFileCompleteInput): Promise<TrueAdminFileRecord> {
  return http.Post<TrueAdminFileRecord>('/admin/files/complete', input).send();
}

function shouldUseDirectUpload(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const reason = (error.details as { data?: { reason?: unknown } } | undefined)?.data?.reason;

  return typeof reason === 'string' && USE_DIRECT_UPLOAD_REASONS.has(reason);
}

export function uploadTrueAdminRemoteFile(
  url: string,
  options: TrueAdminRemoteUploadOptions = {},
): Promise<TrueAdminFileRecord> {
  return http
    .Post<TrueAdminFileRecord>('/admin/files/remote-url', {
      url,
      filename: options.filename,
      category: options.category ?? 'attachment',
      visibility: options.visibility ?? 'public',
    })
    .send();
}
