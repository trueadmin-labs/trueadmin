import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Input, message, Space, Tooltip, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

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

export type TrueAdminAttachmentUploadProps = Omit<
  UploadProps,
  'children' | 'fileList' | 'onChange' | 'beforeUpload' | 'customRequest' | 'onRemove' | 'value'
> & {
  drag?: boolean;
  title?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  value?: TrueAdminAttachmentValue[];
  onChange?: (files: TrueAdminAttachmentValue[]) => void;
  onChangeValue?: (files: TrueAdminAttachmentValue[]) => void;
  upload?: (file: File) => Promise<TrueAdminAttachmentUploadResult>;
  readonly?: boolean;
  editableName?: boolean;
};

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);

function splitName(filename: string) {
  const index = filename.lastIndexOf('.');
  if (index <= 0 || index === filename.length - 1) {
    return { name: filename, extension: undefined };
  }

  return {
    name: filename.slice(0, index),
    extension: filename.slice(index + 1).toLowerCase(),
  };
}

function normalizeAttachmentResult(
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

function getAttachmentDisplayName(file: TrueAdminAttachmentValue) {
  return file.extension ? `${file.name}.${file.extension}` : file.name;
}

function getFileTypeLabel(file: TrueAdminAttachmentValue) {
  return (file.extension || 'file').slice(0, 4).toUpperCase();
}

function formatFileSize(size?: number) {
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

export function TrueAdminAttachmentUpload({
  drag = true,
  title,
  hint,
  value = [],
  onChange,
  children,
  onChangeValue,
  upload,
  readonly = false,
  editableName = true,
  multiple,
  maxCount,
  disabled,
  ...uploadProps
}: TrueAdminAttachmentUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<TrueAdminAttachmentId>();
  const [editingName, setEditingName] = useState('');

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
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  const content = (
    <>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        {title ?? t('upload.attachment.title', '拖拽文件到这里，或点击选择')}
      </p>
      {hint ? <p className="ant-upload-hint">{hint}</p> : null}
    </>
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
    <div className="trueadmin-attachment-upload">
      {canUpload ? <div className="trueadmin-attachment-upload-trigger">{uploader}</div> : null}
      {uploading ? (
        <div className="trueadmin-attachment-uploading">
          {t('upload.attachment.uploading', '正在上传...')}
        </div>
      ) : null}
      {value.length ? (
        <div className="trueadmin-attachment-list">
          {value.map((file) => {
            const isEditing = editingId === file.id;
            const isImage = imageExtensions.has(file.extension?.toLowerCase() ?? '');
            return (
              <div key={file.id} className="trueadmin-attachment-item">
                <div className="trueadmin-attachment-thumb">
                  {isImage ? (
                    <img src={file.url} alt={file.name} />
                  ) : (
                    <span>{getFileTypeLabel(file)}</span>
                  )}
                </div>
                <div className="trueadmin-attachment-meta">
                  {isEditing ? (
                    <Input
                      size="small"
                      value={editingName}
                      autoFocus
                      onChange={(event) => setEditingName(event.target.value)}
                      onBlur={() => confirmEdit(file)}
                      onPressEnter={() => confirmEdit(file)}
                    />
                  ) : (
                    <Tooltip title={getAttachmentDisplayName(file)}>
                      <button
                        type="button"
                        className="trueadmin-attachment-name"
                        onClick={() => preview(file)}
                      >
                        <FileOutlined />
                        <span>{getAttachmentDisplayName(file)}</span>
                      </button>
                    </Tooltip>
                  )}
                  <div className="trueadmin-attachment-subtitle">
                    {[file.extension?.toUpperCase(), formatFileSize(file.size)]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <Space size={2} className="trueadmin-attachment-actions">
                  <Tooltip title={t('upload.attachment.preview', '预览')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => preview(file)}
                    />
                  </Tooltip>
                  <Tooltip title={t('upload.attachment.download', '下载')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      href={file.url}
                      target="_blank"
                    />
                  </Tooltip>
                  {!readonly && editableName ? (
                    <Tooltip title={t('upload.attachment.editName', '编辑名称')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEdit(file)}
                      />
                    </Tooltip>
                  ) : null}
                  {!readonly ? (
                    <Tooltip title={t('upload.attachment.remove', '删除')}>
                      <Button
                        danger
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(file.id)}
                      />
                    </Tooltip>
                  ) : null}
                </Space>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
