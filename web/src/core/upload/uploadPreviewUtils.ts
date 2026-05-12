import type { TrueAdminAttachmentValue } from './attachmentUploadUtils';

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);
const pdfExtensions = new Set(['pdf']);

export const getUploadPreviewDisplayName = (file: TrueAdminAttachmentValue) =>
  file.extension ? `${file.name}.${file.extension}` : file.name;

export const isUploadPreviewImage = (file: TrueAdminAttachmentValue) =>
  imageExtensions.has(file.extension?.toLowerCase() ?? '') || file.mimeType?.startsWith('image/');

export const isUploadPreviewPdf = (file: TrueAdminAttachmentValue) =>
  pdfExtensions.has(file.extension?.toLowerCase() ?? '') || file.mimeType === 'application/pdf';
