import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { Button, Input, Space, Tooltip } from 'antd';
import { useI18n } from '@/core/i18n/I18nProvider';
import type {
  AnimatedAttachment,
  TrueAdminAttachmentId,
  TrueAdminAttachmentValue,
} from './attachmentUploadUtils';
import {
  formatFileSize,
  getAttachmentDisplayName,
  getFileTypeLabel,
  isImageAttachment,
} from './attachmentUploadUtils';

export type TrueAdminAttachmentListProps = {
  files: AnimatedAttachment[];
  readonly?: boolean;
  editableName?: boolean;
  editingId?: TrueAdminAttachmentId;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onConfirmEdit: (file: TrueAdminAttachmentValue) => void;
  onDownload: (file: TrueAdminAttachmentValue) => void;
  onPreview: (file: TrueAdminAttachmentValue) => void;
  onRemove: (id: TrueAdminAttachmentId) => void;
  onStartEdit: (file: TrueAdminAttachmentValue) => void;
};

export function TrueAdminAttachmentList({
  files,
  readonly = false,
  editableName = true,
  editingId,
  editingName,
  onEditingNameChange,
  onConfirmEdit,
  onDownload,
  onPreview,
  onRemove,
  onStartEdit,
}: TrueAdminAttachmentListProps) {
  const { t } = useI18n();

  return (
    <div className="trueadmin-attachment-list">
      {files.map(({ file, phase }) => {
        const isEditing = editingId === file.id;
        const isImage = isImageAttachment(file);

        return (
          <div
            key={file.id}
            className={`trueadmin-attachment-item-shell is-${phase}`}
            aria-hidden={phase === 'leave' ? true : undefined}
          >
            <div className="trueadmin-attachment-item-clip">
              <div className="trueadmin-attachment-item">
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
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      onBlur={() => onConfirmEdit(file)}
                      onPressEnter={() => onConfirmEdit(file)}
                    />
                  ) : (
                    <Tooltip title={getAttachmentDisplayName(file)}>
                      <button
                        type="button"
                        className="trueadmin-attachment-name"
                        onClick={() => onPreview(file)}
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
                      onClick={() => onPreview(file)}
                    />
                  </Tooltip>
                  <Tooltip title={t('upload.attachment.download', '下载')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => onDownload(file)}
                    />
                  </Tooltip>
                  {!readonly && editableName ? (
                    <Tooltip title={t('upload.attachment.editName', '编辑名称')}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onStartEdit(file)}
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
                        onClick={() => onRemove(file.id)}
                      />
                    </Tooltip>
                  ) : null}
                </Space>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
