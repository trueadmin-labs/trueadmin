import { message, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import type {
  TrueAdminImageId,
  TrueAdminImageUploadResult,
  TrueAdminImageValue,
} from './imageUploadUtils';
import { normalizeImageUploadResult, toImageValueArray } from './imageUploadUtils';
import { useTrueAdminUpload } from './useTrueAdminUpload';

type UseImageUploadControllerOptions = {
  maxCount?: number;
  multiple: boolean;
  onChange?: (value: TrueAdminImageValue | TrueAdminImageValue[] | null) => void;
  onChangeValue?: (value: TrueAdminImageValue | TrueAdminImageValue[] | null) => void;
  upload?: (file: File) => Promise<TrueAdminImageUploadResult>;
  value?: TrueAdminImageValue | TrueAdminImageValue[] | null;
};

export function useImageUploadController({
  maxCount,
  multiple,
  onChange,
  onChangeValue,
  upload,
  value,
}: UseImageUploadControllerOptions) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<TrueAdminImageValue>();
  const files = useMemo(() => toImageValueArray(value), [value]);
  const limit = multiple ? maxCount : 1;
  const uploadFile = useCallback(
    (file: File): Promise<TrueAdminImageUploadResult | undefined> =>
      upload ? upload(file) : Promise.resolve(undefined),
    [upload],
  );
  const { upload: runUpload, uploading } = useTrueAdminUpload<
    TrueAdminImageUploadResult | undefined
  >({
    uploadFile,
  });

  const uploadFileList = useMemo<UploadFile[]>(
    () =>
      files.map((file) => ({
        uid: String(file.id),
        name: file.name,
        status: 'done',
        url: file.url,
        size: file.size,
        type: file.mimeType,
      })),
    [files],
  );

  const emitChange = useCallback(
    (nextFiles: TrueAdminImageValue[]) => {
      const nextValue = multiple ? nextFiles : (nextFiles[0] ?? null);
      onChange?.(nextValue);
      onChangeValue?.(nextValue);
    },
    [multiple, onChange, onChangeValue],
  );

  const handleBeforeUpload = useCallback(
    async (file: RcFile, canUpload: boolean) => {
      if (!canUpload && multiple) {
        return Upload.LIST_IGNORE;
      }

      if (!file.type.startsWith('image/')) {
        message.error(t('upload.image.invalidType', '请选择图片文件'));
        return Upload.LIST_IGNORE;
      }

      try {
        const nextFile = normalizeImageUploadResult(await runUpload(file), file);
        const nextFiles = multiple ? [...files, nextFile] : [nextFile];
        emitChange(limit ? nextFiles.slice(0, limit) : nextFiles);
      } catch (error) {
        message.error(t('upload.image.uploadFailed', '图片上传失败'));
        throw error;
      }

      return Upload.LIST_IGNORE;
    },
    [emitChange, files, limit, multiple, runUpload, t],
  );

  const handleRemove = useCallback(
    (id: TrueAdminImageId) => {
      emitChange(files.filter((file) => file.id !== id));
    },
    [emitChange, files],
  );

  return {
    files,
    handleBeforeUpload,
    handleRemove,
    limit,
    preview,
    setPreview,
    uploadFileList,
    uploading,
  };
}
