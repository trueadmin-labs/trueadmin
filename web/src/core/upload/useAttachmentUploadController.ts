import { message, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { useCallback, useMemo, useState } from 'react';
import { useTrueAdminDownload } from '@/core/download';
import { useI18n } from '@/core/i18n/I18nProvider';
import type {
  TrueAdminAttachmentId,
  TrueAdminAttachmentUploadResult,
  TrueAdminAttachmentValue,
} from './attachmentUploadUtils';
import { getAttachmentDisplayName, normalizeAttachmentResult } from './attachmentUploadUtils';

type UseAttachmentUploadControllerOptions = {
  canUpload: boolean;
  maxCount?: number;
  multiple?: boolean;
  onChange?: (files: TrueAdminAttachmentValue[]) => void;
  onChangeValue?: (files: TrueAdminAttachmentValue[]) => void;
  onPreview?: (file: TrueAdminAttachmentValue) => void;
  upload?: (file: File) => Promise<TrueAdminAttachmentUploadResult>;
  value: TrueAdminAttachmentValue[];
};

export function useAttachmentUploadController({
  canUpload,
  maxCount,
  multiple,
  onChange,
  onChangeValue,
  onPreview,
  upload,
  value,
}: UseAttachmentUploadControllerOptions) {
  const { t } = useI18n();
  const { download } = useTrueAdminDownload();
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<TrueAdminAttachmentId>();
  const [editingName, setEditingName] = useState('');
  const [previewFile, setPreviewFile] = useState<TrueAdminAttachmentValue>();
  const [previewOpen, setPreviewOpen] = useState(false);

  const uploadFileList = useMemo<UploadFile[]>(
    () =>
      value.map((file) => ({
        uid: String(file.id),
        name: getAttachmentDisplayName(file),
        status: 'done',
        url: file.url,
        size: file.size,
        type: file.mimeType,
      })),
    [value],
  );

  const emitChange = useCallback(
    (nextFiles: TrueAdminAttachmentValue[]) => {
      onChange?.(nextFiles);
      onChangeValue?.(nextFiles);
    },
    [onChange, onChangeValue],
  );

  const handleBeforeUpload = useCallback(
    async (file: RcFile) => {
      if (!canUpload) {
        return Upload.LIST_IGNORE;
      }

      setUploading(true);
      try {
        const result = upload ? await upload(file) : undefined;
        const nextFile = normalizeAttachmentResult(result, file);
        const nextFiles = multiple ? [...value, nextFile] : [nextFile];
        emitChange(maxCount ? nextFiles.slice(0, maxCount) : nextFiles);
      } catch (error) {
        message.error(t('upload.attachment.uploadFailed', '文件上传失败'));
        throw error;
      } finally {
        setUploading(false);
      }

      return Upload.LIST_IGNORE;
    },
    [canUpload, emitChange, maxCount, multiple, t, upload, value],
  );

  const handleRemove = useCallback(
    (id: TrueAdminAttachmentId) => {
      emitChange(value.filter((file) => file.id !== id));
    },
    [emitChange, value],
  );

  const startEdit = useCallback((file: TrueAdminAttachmentValue) => {
    setEditingId(file.id);
    setEditingName(file.name);
  }, []);

  const confirmEdit = useCallback(
    (file: TrueAdminAttachmentValue) => {
      const nextName = editingName.trim();
      if (nextName) {
        emitChange(value.map((item) => (item.id === file.id ? { ...item, name: nextName } : item)));
      }
      setEditingId(undefined);
      setEditingName('');
    },
    [editingName, emitChange, value],
  );

  const preview = useCallback(
    (file: TrueAdminAttachmentValue) => {
      if (onPreview) {
        onPreview(file);
        return;
      }

      setPreviewFile(file);
      setPreviewOpen(true);
    },
    [onPreview],
  );

  const downloadAttachment = useCallback(
    (file: TrueAdminAttachmentValue) => {
      void download(file.url, { filename: getAttachmentDisplayName(file) });
    },
    [download],
  );

  return {
    confirmEdit,
    downloadAttachment,
    editingId,
    editingName,
    handleBeforeUpload,
    handleRemove,
    preview,
    previewFile,
    previewOpen,
    setEditingName,
    setPreviewOpen,
    startEdit,
    uploadFileList,
    uploading,
  };
}
