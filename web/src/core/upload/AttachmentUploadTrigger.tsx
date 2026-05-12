import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import type { TranslateFunction } from '@/core/i18n/trans';

type AttachmentUploadTriggerProps = {
  canUpload: boolean;
  children?: ReactNode;
  drag: boolean;
  fileList: UploadFile[];
  hint?: ReactNode;
  maxCount?: number;
  multiple?: boolean;
  title?: ReactNode;
  uploadProps: UploadProps;
  t: TranslateFunction;
  onBeforeUpload: UploadProps['beforeUpload'];
};

export function AttachmentUploadTrigger({
  canUpload,
  children,
  drag,
  fileList,
  hint,
  maxCount,
  multiple,
  title,
  uploadProps,
  t,
  onBeforeUpload,
}: AttachmentUploadTriggerProps) {
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

  if (!drag) {
    return (
      <Upload
        {...uploadProps}
        disabled={!canUpload}
        fileList={fileList}
        maxCount={maxCount}
        multiple={multiple}
        showUploadList={false}
        beforeUpload={onBeforeUpload}
      >
        {children ?? title ?? t('upload.attachment.title', '选择文件')}
      </Upload>
    );
  }

  return (
    <Upload.Dragger
      {...uploadProps}
      disabled={!canUpload}
      fileList={fileList}
      maxCount={maxCount}
      multiple={multiple}
      showUploadList={false}
      beforeUpload={onBeforeUpload}
    >
      {content}
    </Upload.Dragger>
  );
}
