import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import type { ReactNode } from 'react';
import type { TrueAdminAttachmentValue } from './attachmentUploadUtils';

type UploadPreviewFooterProps = {
  downloadText: ReactNode;
  file?: TrueAdminAttachmentValue;
  openInNewTabText: ReactNode;
  onDownload: () => void;
  onOpenInNewTab: () => void;
};

export function UploadPreviewFooter({
  downloadText,
  file,
  openInNewTabText,
  onDownload,
  onOpenInNewTab,
}: UploadPreviewFooterProps) {
  if (!file) {
    return null;
  }

  return (
    <Space size={8} wrap>
      <Button icon={<LinkOutlined />} onClick={onOpenInNewTab}>
        {openInNewTabText}
      </Button>
      <Button icon={<DownloadOutlined />} onClick={onDownload}>
        {downloadText}
      </Button>
    </Space>
  );
}
