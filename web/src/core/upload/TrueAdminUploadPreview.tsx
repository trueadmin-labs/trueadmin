import { DownloadOutlined, FileOutlined } from '@ant-design/icons';
import type { ModalProps } from 'antd';
import { Button, Image, Modal, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import type { TrueAdminAttachmentValue } from './TrueAdminAttachmentUpload';

export type TrueAdminUploadPreviewClassNames = {
  root?: string;
  body?: string;
  file?: string;
};

export type TrueAdminUploadPreviewStyles = {
  root?: CSSProperties;
  body?: CSSProperties;
  file?: CSSProperties;
};

export type TrueAdminUploadPreviewProps = Omit<ModalProps, 'children' | 'open' | 'title'> & {
  file?: TrueAdminAttachmentValue;
  open?: boolean;
  defaultOpen?: boolean;
  trigger?: ReactNode | ((file: TrueAdminAttachmentValue | undefined) => ReactNode);
  title?: ReactNode;
  downloadText?: ReactNode;
  unsupportedText?: ReactNode;
  classNames?: TrueAdminUploadPreviewClassNames;
  styles?: TrueAdminUploadPreviewStyles;
  onOpenChange?: (open: boolean) => void;
};

const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);
const pdfExtensions = new Set(['pdf']);

const getDisplayName = (file: TrueAdminAttachmentValue) =>
  file.extension ? `${file.name}.${file.extension}` : file.name;

const isImageFile = (file: TrueAdminAttachmentValue) =>
  imageExtensions.has(file.extension?.toLowerCase() ?? '') || file.mimeType?.startsWith('image/');

const isPdfFile = (file: TrueAdminAttachmentValue) =>
  pdfExtensions.has(file.extension?.toLowerCase() ?? '') || file.mimeType === 'application/pdf';

export function TrueAdminUploadPreview({
  file,
  open,
  defaultOpen = false,
  trigger,
  title,
  downloadText,
  unsupportedText,
  className,
  classNames,
  styles,
  style,
  footer,
  width = 880,
  onCancel,
  onOpenChange,
  ...modalProps
}: TrueAdminUploadPreviewProps) {
  const { t } = useI18n();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const mergedOpen = open ?? innerOpen;
  const mergedDownloadText = downloadText ?? t('upload.preview.download', '下载文件');
  const mergedUnsupportedText =
    unsupportedText ?? t('upload.preview.unsupported', '当前文件暂不支持在线预览，请下载后查看。');

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setInnerOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const displayName = file ? getDisplayName(file) : undefined;
  const previewBody = useMemo(() => {
    if (!file) {
      return null;
    }

    if (isImageFile(file)) {
      return <Image src={file.url} alt={file.name} className="trueadmin-upload-preview-image" />;
    }

    if (isPdfFile(file)) {
      return (
        <iframe title={displayName} src={file.url} className="trueadmin-upload-preview-frame" />
      );
    }

    return (
      <div className="trueadmin-upload-preview-file" style={styles?.file}>
        <FileOutlined className="trueadmin-upload-preview-file-icon" />
        <Typography.Text type="secondary">{mergedUnsupportedText}</Typography.Text>
        <Button type="primary" icon={<DownloadOutlined />} href={file.url} target="_blank">
          {mergedDownloadText}
        </Button>
      </div>
    );
  }, [displayName, file, mergedDownloadText, mergedUnsupportedText, styles?.file]);

  const triggerNode = typeof trigger === 'function' ? trigger(file) : trigger;

  return (
    <>
      {triggerNode ? (
        <button
          className="trueadmin-upload-preview-trigger"
          type="button"
          onClick={() => setOpen(true)}
        >
          {triggerNode}
        </button>
      ) : null}
      <Modal
        {...modalProps}
        className={['trueadmin-upload-preview', classNames?.root, className]
          .filter(Boolean)
          .join(' ')}
        footer={
          footer ??
          (file ? (
            <Button icon={<DownloadOutlined />} href={file.url} target="_blank">
              {mergedDownloadText}
            </Button>
          ) : null)
        }
        open={mergedOpen}
        style={{ ...styles?.root, ...style }}
        title={title ?? displayName}
        width={width}
        onCancel={(event) => {
          setOpen(false);
          onCancel?.(event);
        }}
      >
        <div
          className={['trueadmin-upload-preview-body', classNames?.body].filter(Boolean).join(' ')}
          style={styles?.body}
        >
          {previewBody}
        </div>
      </Modal>
    </>
  );
}
