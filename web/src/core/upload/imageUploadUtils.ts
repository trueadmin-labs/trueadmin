import type { CSSProperties } from 'react';

export type TrueAdminImageId = string | number;

export type TrueAdminImageValue = {
  id: TrueAdminImageId;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
};

export type TrueAdminImageUploadResult = Partial<TrueAdminImageValue> & {
  id?: TrueAdminImageId;
  name?: string;
  originalName?: string;
  originName?: string;
  origin_name?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  type?: string;
};

export type TrueAdminImagePreviewSize =
  | number
  | {
      width?: number | string;
      height?: number | string;
    };

export const DEFAULT_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

export function toImageValueArray(
  value: TrueAdminImageValue | TrueAdminImageValue[] | null | undefined,
): TrueAdminImageValue[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function normalizeImageUploadResult(
  result: TrueAdminImageUploadResult | undefined,
  file: File,
): TrueAdminImageValue {
  const raw = result ?? {};
  const name = raw.name ?? raw.originalName ?? raw.originName ?? raw.origin_name ?? file.name;

  return {
    id: raw.id ?? `${Date.now()}-${file.name}`,
    name,
    url: raw.url ?? URL.createObjectURL(file),
    size: raw.size ?? file.size,
    mimeType: raw.mimeType ?? raw.type ?? file.type,
  };
}

export function getImagePreviewSizeStyle(
  previewSize?: TrueAdminImagePreviewSize,
): CSSProperties | undefined {
  if (previewSize === undefined) {
    return undefined;
  }

  if (typeof previewSize === 'number') {
    return {
      '--trueadmin-image-upload-width': `${previewSize}px`,
      '--trueadmin-image-upload-height': `${previewSize}px`,
    } as CSSProperties;
  }

  return {
    '--trueadmin-image-upload-width':
      typeof previewSize.width === 'number' ? `${previewSize.width}px` : previewSize.width,
    '--trueadmin-image-upload-height':
      typeof previewSize.height === 'number' ? `${previewSize.height}px` : previewSize.height,
  } as CSSProperties;
}
