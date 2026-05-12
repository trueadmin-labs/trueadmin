import type { UploadProps } from 'antd';
import { Empty } from 'antd';
import type { ReactNode } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { AttachmentUploadTrigger } from './AttachmentUploadTrigger';
import type {
  TrueAdminAttachmentUploadResult,
  TrueAdminAttachmentValue,
} from './attachmentUploadUtils';
import { TrueAdminAttachmentList } from './TrueAdminAttachmentList';
import { TrueAdminUploadPreview, type TrueAdminUploadPreviewProps } from './TrueAdminUploadPreview';
import { useAttachmentUploadAnimation } from './useAttachmentUploadAnimation';
import { useAttachmentUploadController } from './useAttachmentUploadController';

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
  const { animatedFiles, contentHeight, contentRef } = useAttachmentUploadAnimation(value);
  const canUpload = !readonly && !disabled && (!maxCount || value.length < maxCount);
  const {
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
  } = useAttachmentUploadController({
    canUpload,
    maxCount,
    multiple,
    onChange,
    onChangeValue,
    onPreview,
    upload,
    value,
  });
  const showEmpty = !canUpload && animatedFiles.length === 0 && !uploading;

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
          {canUpload ? (
            <div className="trueadmin-attachment-upload-trigger">
              <AttachmentUploadTrigger
                canUpload={canUpload}
                drag={drag}
                fileList={uploadFileList}
                hint={hint}
                maxCount={maxCount}
                multiple={multiple}
                title={title}
                uploadProps={uploadProps}
                t={t}
                onBeforeUpload={handleBeforeUpload}
              >
                {children}
              </AttachmentUploadTrigger>
            </div>
          ) : null}
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
