import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Empty, message, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTrueAdminDownload } from '@/core/download';
import { useI18n } from '@/core/i18n/I18nProvider';
import type {
  TrueAdminAttachmentId,
  TrueAdminAttachmentUploadResult,
  TrueAdminAttachmentValue,
} from './attachmentUploadUtils';
import { getAttachmentDisplayName, normalizeAttachmentResult } from './attachmentUploadUtils';
import { TrueAdminAttachmentList } from './TrueAdminAttachmentList';
import { TrueAdminUploadPreview, type TrueAdminUploadPreviewProps } from './TrueAdminUploadPreview';
import { useAttachmentUploadAnimation } from './useAttachmentUploadAnimation';

export type {
  TrueAdminAttachmentId,
  TrueAdminAttachmentUploadResult,
  TrueAdminAttachmentValue,
} from './attachmentUploadUtils';

export type TrueAdminAttachmentUploadProps = Omit<
  UploadProps,
  | 'beforeUpload'
  | 'children'
  | 'customRequest'
  | 'fileList'
  | 'onChange'
  | 'onPreview'
  | 'onRemove'
  | 'value'
> & {
  drag?: boolean;
  title?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  value?: TrueAdminAttachmentValue[];
  onChange?: (files: TrueAdminAttachmentValue[]) => void;
  onChangeValue?: (files: TrueAdminAttachmentValue[]) => void;
  onPreview?: (file: TrueAdminAttachmentValue) => void;
  previewProps?: Omit<TrueAdminUploadPreviewProps, 'file' | 'onOpenChange' | 'open' | 'trigger'>;
  upload?: (file: File) => Promise<TrueAdminAttachmentUploadResult>;
  readonly?: boolean;
  editableName?: boolean;
  emptyText?: ReactNode;
};

export function TrueAdminAttachmentUpload({
  drag = true,
  title,
  hint,
  value = [],
  onChange,
  children,
  onChangeValue,
  onPreview,
  previewProps,
  upload,
  readonly = false,
  editableName = true,
  emptyText,
  multiple,
  maxCount,
  disabled,
  ...uploadProps
}: TrueAdminAttachmentUploadProps) {
  const { t } = useI18n();
  const { download } = useTrueAdminDownload();
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<TrueAdminAttachmentId>();
  const [editingName, setEditingName] = useState('');
  const [previewFile, setPreviewFile] = useState<TrueAdminAttachmentValue>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { animatedFiles, contentHeight, contentRef } = useAttachmentUploadAnimation(value);

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

  const canUpload = !readonly && !disabled && (!maxCount || value.length < maxCount);
  const showEmpty = !canUpload && animatedFiles.length === 0 && !uploading;

  const emitChange = (nextFiles: TrueAdminAttachmentValue[]) => {
    onChange?.(nextFiles);
    onChangeValue?.(nextFiles);
  };

  const handleBeforeUpload = async (file: RcFile) => {
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
  };

  const handleRemove = (id: TrueAdminAttachmentId) => {
    emitChange(value.filter((file) => file.id !== id));
  };

  const startEdit = (file: TrueAdminAttachmentValue) => {
    setEditingId(file.id);
    setEditingName(file.name);
  };

  const confirmEdit = (file: TrueAdminAttachmentValue) => {
    const nextName = editingName.trim();
    if (nextName) {
      emitChange(value.map((item) => (item.id === file.id ? { ...item, name: nextName } : item)));
    }
    setEditingId(undefined);
    setEditingName('');
  };

  const preview = (file: TrueAdminAttachmentValue) => {
    if (onPreview) {
      onPreview(file);
      return;
    }

    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const downloadAttachment = (file: TrueAdminAttachmentValue) => {
    void download(file.url, { filename: getAttachmentDisplayName(file) });
  };

  const content = (
    <div className="trueadmin-attachment-upload-content">
      <span className="trueadmin-attachment-upload-icon">
        <InboxOutlined />
      </span>
      <span className="trueadmin-attachment-upload-text">
        {title ?? t('upload.attachment.title', '拖拽文件到这里，或点击选择')}
      </span>
      {hint ? <span className="trueadmin-attachment-upload-hint">{hint}</span> : null}
    </div>
  );

  const uploader = drag ? (
    <Upload.Dragger
      {...uploadProps}
      disabled={!canUpload}
      fileList={uploadFileList}
      maxCount={maxCount}
      multiple={multiple}
      showUploadList={false}
      beforeUpload={handleBeforeUpload}
    >
      {content}
    </Upload.Dragger>
  ) : (
    <Upload
      {...uploadProps}
      disabled={!canUpload}
      fileList={uploadFileList}
      maxCount={maxCount}
      multiple={multiple}
      showUploadList={false}
      beforeUpload={handleBeforeUpload}
    >
      {children ?? title ?? t('upload.attachment.title', '选择文件')}
    </Upload>
  );

  return (
    <>
      <div
        className="trueadmin-attachment-upload-frame"
        style={contentHeight === undefined ? undefined : { height: contentHeight }}
      >
        <div ref={contentRef} className="trueadmin-attachment-upload">
          {animatedFiles.length ? (
            <TrueAdminAttachmentList
              editableName={editableName}
              editingId={editingId}
              editingName={editingName}
              files={animatedFiles}
              readonly={readonly}
              onConfirmEdit={confirmEdit}
              onDownload={downloadAttachment}
              onEditingNameChange={setEditingName}
              onPreview={preview}
              onRemove={handleRemove}
              onStartEdit={startEdit}
            />
          ) : null}
          {canUpload ? <div className="trueadmin-attachment-upload-trigger">{uploader}</div> : null}
          {showEmpty ? (
            <Empty
              className="trueadmin-attachment-empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyText ?? t('upload.attachment.empty', '暂无附件')}
            />
          ) : null}
          {uploading ? (
            <div className="trueadmin-attachment-uploading">
              {t('upload.attachment.uploading', '正在上传...')}
            </div>
          ) : null}
        </div>
      </div>
      {onPreview ? null : (
        <TrueAdminUploadPreview
          {...previewProps}
          file={previewFile}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  );
}
