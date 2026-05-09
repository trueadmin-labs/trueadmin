import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Empty, Image, message, Tooltip, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

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

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

function toArray(value: TrueAdminImageUploadProps['value']): TrueAdminImageValue[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeUploadResult(
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

function getSizeStyle(previewSize?: TrueAdminImagePreviewSize): CSSProperties | undefined {
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
  accept = DEFAULT_ACCEPT,
  ...uploadProps
}: TrueAdminImageUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const files = useMemo(() => toArray(value), [value]);
  const [preview, setPreview] = useState<TrueAdminImageValue>();

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

  const limit = multiple ? maxCount : 1;
  const canUpload = !readonly && !disabled && (!limit || files.length < limit);
  const sizeStyle = getSizeStyle(previewSize);

  const emitChange = (nextFiles: TrueAdminImageValue[]) => {
    const nextValue = multiple ? nextFiles : (nextFiles[0] ?? null);
    onChange?.(nextValue);
    onChangeValue?.(nextValue);
  };

  const handleBeforeUpload = async (file: RcFile) => {
    if (!canUpload && multiple) {
      return Upload.LIST_IGNORE;
    }

    if (!file.type.startsWith('image/')) {
      message.error(t('upload.image.invalidType', '请选择图片文件'));
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const nextFile = normalizeUploadResult(upload ? await upload(file) : undefined, file);
      const nextFiles = multiple ? [...files, nextFile] : [nextFile];
      emitChange(limit ? nextFiles.slice(0, limit) : nextFiles);
    } catch (error) {
      message.error(t('upload.image.uploadFailed', '图片上传失败'));
      throw error;
    } finally {
      setUploading(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemove = (id: TrueAdminImageId) => {
    emitChange(files.filter((file) => file.id !== id));
  };

  const uploader = (
    <Upload
      {...uploadProps}
      accept={accept}
      beforeUpload={handleBeforeUpload}
      disabled={disabled || readonly || (!multiple && files.length > 0)}
      fileList={uploadFileList}
      maxCount={limit}
      multiple={multiple}
      showUploadList={false}
    >
      <button
        type="button"
        className="trueadmin-image-upload-add"
        style={sizeStyle}
        disabled={disabled || readonly || uploading || (!multiple && files.length > 0)}
      >
        <PlusOutlined />
        <span>{addText ?? t('upload.image.add', '上传图片')}</span>
      </button>
    </Upload>
  );

  return (
    <div className="trueadmin-image-upload">
      <div className="trueadmin-image-upload-list">
        {files.map((file) => (
          <div key={file.id} className="trueadmin-image-upload-item" style={sizeStyle}>
            <img src={file.url} alt={file.name} />
            <div className="trueadmin-image-upload-mask">
              <Tooltip title={t('upload.image.preview', '预览')}>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setPreview(file)}
                />
              </Tooltip>
              {!readonly ? (
                <Tooltip title={t('upload.image.remove', '移除')}>
                  <Button
                    danger
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(file.id)}
                  />
                </Tooltip>
              ) : null}
            </div>
          </div>
        ))}
        {canUpload ? uploader : null}
      </div>
      {!files.length && !canUpload ? (
        <Empty
          className="trueadmin-image-upload-empty"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={emptyText ?? t('upload.image.empty', '暂无图片')}
        />
      ) : null}
      {!multiple && files.length > 0 && !readonly && !disabled ? (
        <Upload
          {...uploadProps}
          accept={accept}
          beforeUpload={handleBeforeUpload}
          fileList={uploadFileList}
          maxCount={1}
          showUploadList={false}
        >
          <Button size="small" loading={uploading}>
            {replaceText ?? t('upload.image.replace', '更换图片')}
          </Button>
        </Upload>
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
