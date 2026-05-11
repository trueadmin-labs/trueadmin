export type TrueAdminAttachmentId = string | number;

export type TrueAdminAttachmentValue = {
  id: TrueAdminAttachmentId;
  name: string;
  url: string;
  extension?: string;
  size?: number;
  mimeType?: string;
};

export type TrueAdminAttachmentUploadResult = Partial<TrueAdminAttachmentValue> & {
  id?: TrueAdminAttachmentId;
  name?: string;
  originalName?: string;
  originName?: string;
  origin_name?: string;
  url?: string;
  extension?: string;
  suffix?: string;
  size?: number;
  mimeType?: string;
  type?: string;
};

export type AnimatedAttachment = {
  file: TrueAdminAttachmentValue;
  phase: 'enter' | 'active' | 'leave';
};

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);

export const attachmentMotionDuration = 220;

export function splitName(filename: string) {
  const index = filename.lastIndexOf('.');
  if (index <= 0 || index === filename.length - 1) {
    return { name: filename, extension: undefined };
  }

  return {
    name: filename.slice(0, index),
    extension: filename.slice(index + 1).toLowerCase(),
  };
}

export function normalizeAttachmentResult(
  result: TrueAdminAttachmentUploadResult | undefined,
  file: File,
): TrueAdminAttachmentValue {
  const fallback = splitName(file.name);
  const raw = result ?? {};
  const rawName = raw.name ?? raw.originalName ?? raw.originName ?? raw.origin_name ?? file.name;
  const rawExtension = raw.extension ?? raw.suffix;
  const normalizedName = rawExtension
    ? rawName.replace(new RegExp(`\\.${rawExtension}$`, 'i'), '')
    : splitName(rawName).name;

  return {
    id: raw.id ?? `${Date.now()}-${file.name}`,
    name: normalizedName || fallback.name,
    url: raw.url ?? URL.createObjectURL(file),
    extension: (rawExtension ?? splitName(rawName).extension ?? fallback.extension)?.toLowerCase(),
    size: raw.size ?? file.size,
    mimeType: raw.mimeType ?? raw.type ?? file.type,
  };
}

export function getAttachmentDisplayName(file: TrueAdminAttachmentValue) {
  return file.extension ? `${file.name}.${file.extension}` : file.name;
}

export function getFileTypeLabel(file: TrueAdminAttachmentValue) {
  return (file.extension || 'file').slice(0, 4).toUpperCase();
}

export function formatFileSize(size?: number) {
  if (!size) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function isImageAttachment(file: TrueAdminAttachmentValue) {
  return imageExtensions.has(file.extension?.toLowerCase() ?? '');
}
