import { DownloadOutlined, FileOutlined } from '@ant-design/icons';
import { Button, Image, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { TrueAdminAttachmentValue } from './attachmentUploadUtils';
import type { TrueAdminUploadPreviewStyles } from './TrueAdminUploadPreview';
import { isUploadPreviewImage, isUploadPreviewPdf } from './uploadPreviewUtils';

type UploadPreviewBodyProps = {
  displayName?: string;
  downloadText: ReactNode;
  file?: TrueAdminAttachmentValue;
  styles?: TrueAdminUploadPreviewStyles;
  unsupportedText: ReactNode;
  onDownload: () => void;
};

export function UploadPreviewBody({
  displayName,
  downloadText,
  file,
  styles,
  unsupportedText,
  onDownload,
}: UploadPreviewBodyProps) {
  if (!file) {
    return null;
  }

  if (isUploadPreviewImage(file)) {
    return <Image src={file.url} alt={file.name} className="trueadmin-upload-preview-image" />;
  }

  if (isUploadPreviewPdf(file)) {
    return <iframe title={displayName} src={file.url} className="trueadmin-upload-preview-frame" />;
  }

  return (
    <div className="trueadmin-upload-preview-file" style={styles?.file}>
      <FileOutlined className="trueadmin-upload-preview-file-icon" />
      <Typography.Text type="secondary">{unsupportedText}</Typography.Text>
      <Button type="primary" icon={<DownloadOutlined />} onClick={onDownload}>
        {downloadText}
      </Button>
    </div>
  );
}
