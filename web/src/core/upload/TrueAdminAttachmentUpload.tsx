import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

export type TrueAdminAttachmentUploadProps = Omit<UploadProps, 'children'> & {
  drag?: boolean;
  title?: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
  value?: UploadFile[];
  onChangeValue?: (files: UploadFile[]) => void;
};

export function TrueAdminAttachmentUpload({
  drag = true,
  title,
  hint,
  value,
  children,
  fileList,
  onChange,
  onChangeValue,
  beforeUpload,
  ...uploadProps
}: TrueAdminAttachmentUploadProps) {
  const { t } = useI18n();
  const mergedFileList = value ?? fileList;
  const mergedBeforeUpload: UploadProps['beforeUpload'] = beforeUpload ?? (() => false);
  const handleChange: UploadProps['onChange'] = (info) => {
    onChange?.(info);
    onChangeValue?.(info.fileList);
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

  if (drag) {
    return (
      <Upload.Dragger
        {...uploadProps}
        beforeUpload={mergedBeforeUpload}
        fileList={mergedFileList}
        onChange={handleChange}
      >
        {content}
      </Upload.Dragger>
    );
  }

  return (
    <Upload
      {...uploadProps}
      beforeUpload={mergedBeforeUpload}
      fileList={mergedFileList}
      onChange={handleChange}
    >
      {children ?? title ?? t('upload.attachment.title', '选择文件')}
    </Upload>
  );
}
