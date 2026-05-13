import type { UploadProps } from 'antd';
import { Empty, Image } from 'antd';
import type { ReactNode } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { ImageUploadAddTrigger } from './ImageUploadAddTrigger';
import { ImageUploadReplaceTrigger } from './ImageUploadReplaceTrigger';
import {
  DEFAULT_IMAGE_ACCEPT,
  getImagePreviewSizeStyle,
  type TrueAdminImagePreviewSize,
  type TrueAdminImageUploadResult,
  type TrueAdminImageValue,
} from './imageUploadUtils';
import { TrueAdminImageUploadItem } from './TrueAdminImageUploadItem';
import { useImageUploadController } from './useImageUploadController';
import './upload.css';

export type {
  TrueAdminImageId,
  TrueAdminImagePreviewSize,
  TrueAdminImageUploadResult,
  TrueAdminImageValue,
} from './imageUploadUtils';

export type TrueAdminImageUploadProps = Omit<
  UploadProps,
  | 'accept'
  | 'beforeUpload'
  | 'children'
  | 'customRequest'
  | 'fileList'
  | 'listType'
  | 'multiple'
  | 'onChange'
  | 'onPreview'
  | 'onRemove'
  | 'showUploadList'
  | 'value'
> & {
  value?: TrueAdminImageValue | TrueAdminImageValue[] | null;
  onChange?: (value: TrueAdminImageValue | TrueAdminImageValue[] | null) => void;
  onChangeValue?: (value: TrueAdminImageValue | TrueAdminImageValue[] | null) => void;
  upload?: (file: File) => Promise<TrueAdminImageUploadResult>;
  multiple?: boolean;
  maxCount?: number;
  previewSize?: TrueAdminImagePreviewSize;
  readonly?: boolean;
  emptyText?: ReactNode;
  addText?: ReactNode;
  replaceText?: ReactNode;
  accept?: string;
};

export function TrueAdminImageUpload({
  value,
  onChange,
  onChangeValue,
  upload,
  multiple = false,
  maxCount,
  previewSize,
  readonly = false,
  disabled,
  emptyText,
  addText,
  replaceText,
  accept = DEFAULT_IMAGE_ACCEPT,
  ...uploadProps
}: TrueAdminImageUploadProps) {
  const { t } = useI18n();
  const {
    files,
    handleBeforeUpload,
    handleRemove,
    limit,
    preview,
    setPreview,
    uploadFileList,
    uploading,
  } = useImageUploadController({
    maxCount,
    multiple,
    onChange,
    onChangeValue,
    upload,
    value,
  });
  const canUpload = !readonly && !disabled && (!limit || files.length < limit);
  const sizeStyle = getImagePreviewSizeStyle(previewSize);

  return (
    <div className="trueadmin-image-upload">
      <div className="trueadmin-image-upload-list">
        {files.map((file) => (
          <TrueAdminImageUploadItem
            key={file.id}
            file={file}
            readonly={readonly}
            sizeStyle={sizeStyle}
            t={t}
            onPreview={setPreview}
            onRemove={handleRemove}
          />
        ))}
        {canUpload ? (
          <ImageUploadAddTrigger
            accept={accept}
            addText={addText}
            canUpload={canUpload}
            fileList={uploadFileList}
            limit={limit}
            multiple={multiple}
            sizeStyle={sizeStyle}
            uploadProps={uploadProps}
            uploading={uploading}
            t={t}
            onBeforeUpload={(file) => handleBeforeUpload(file, canUpload)}
          />
        ) : null}
      </div>
      {!files.length && !canUpload ? (
        <Empty
          className="trueadmin-image-upload-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText ?? t('upload.image.empty', '暂无图片')}
        />
      ) : null}
      {!multiple && files.length > 0 && !readonly && !disabled ? (
        <ImageUploadReplaceTrigger
          accept={accept}
          fileList={uploadFileList}
          replaceText={replaceText}
          uploadProps={uploadProps}
          uploading={uploading}
          t={t}
          onBeforeUpload={(file) => handleBeforeUpload(file, canUpload)}
        />
      ) : null}
      <Image
        src={preview?.url}
        alt={preview?.name}
        style={{ display: 'none' }}
        preview={{
          visible: Boolean(preview),
          src: preview?.url,
          onVisibleChange: (visible) => {
            if (!visible) {
              setPreview(undefined);
            }
          },
        }}
      />
    </div>
  );
}
