import { PlusOutlined } from '@ant-design/icons';
import type { TranslateFunction } from '@trueadmin/web-core/i18n';
import type { UploadProps } from 'antd';
import { Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { CSSProperties, ReactNode } from 'react';

type ImageUploadAddTriggerProps = {
  accept: string;
  addText?: ReactNode;
  canUpload: boolean;
  fileList: UploadFile[];
  limit?: number;
  multiple: boolean;
  sizeStyle?: CSSProperties;
  uploadProps: UploadProps;
  uploading: boolean;
  t: TranslateFunction;
  onBeforeUpload: UploadProps['beforeUpload'];
};

export function ImageUploadAddTrigger({
  accept,
  addText,
  canUpload,
  fileList,
  limit,
  multiple,
  sizeStyle,
  uploadProps,
  uploading,
  t,
  onBeforeUpload,
}: ImageUploadAddTriggerProps) {
  return (
    <Upload
      {...uploadProps}
      accept={accept}
      beforeUpload={onBeforeUpload}
      disabled={!canUpload}
      fileList={fileList}
      maxCount={limit}
      multiple={multiple}
      showUploadList={false}
    >
      <button
        type="button"
        className="trueadmin-image-upload-add"
        style={sizeStyle}
        disabled={!canUpload || uploading}
      >
        <PlusOutlined />
        <span>{addText ?? t('upload.image.add', '上传图片')}</span>
      </button>
    </Upload>
  );
}
