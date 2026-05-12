import type { UploadProps } from 'antd';
import { Button, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ReactNode } from 'react';
import type { TranslateFunction } from '@/core/i18n/trans';

type ImageUploadReplaceTriggerProps = {
  accept: string;
  fileList: UploadFile[];
  replaceText?: ReactNode;
  uploadProps: UploadProps;
  uploading: boolean;
  t: TranslateFunction;
  onBeforeUpload: UploadProps['beforeUpload'];
};

export function ImageUploadReplaceTrigger({
  accept,
  fileList,
  replaceText,
  uploadProps,
  uploading,
  t,
  onBeforeUpload,
}: ImageUploadReplaceTriggerProps) {
  return (
    <Upload
      {...uploadProps}
      accept={accept}
      beforeUpload={onBeforeUpload}
      fileList={fileList}
      maxCount={1}
      showUploadList={false}
    >
      <Button size="small" loading={uploading}>
        {replaceText ?? t('upload.image.replace', '更换图片')}
      </Button>
    </Upload>
  );
}
