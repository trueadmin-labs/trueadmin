import type { ModalProps } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useTrueAdminDownload } from '@/core/download';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminModal } from '@/core/modal';
import type { TrueAdminAttachmentValue } from './attachmentUploadUtils';
import { UploadPreviewBody } from './UploadPreviewBody';
import { UploadPreviewFooter } from './UploadPreviewFooter';
import { getUploadPreviewDisplayName } from './uploadPreviewUtils';

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
  fullscreen?: boolean;
  defaultFullscreen?: boolean;
  trigger?: ReactNode | ((file: TrueAdminAttachmentValue | undefined) => ReactNode);
  title?: ReactNode;
  downloadText?: ReactNode;
  openInNewTabText?: ReactNode;
  fullscreenText?: ReactNode;
  exitFullscreenText?: ReactNode;
  unsupportedText?: ReactNode;
  classNames?: TrueAdminUploadPreviewClassNames;
  styles?: TrueAdminUploadPreviewStyles;
  onOpenChange?: (open: boolean) => void;
  onFullscreenChange?: (fullscreen: boolean) => void;
};

export function TrueAdminUploadPreview({
  file,
  open,
  defaultOpen = false,
  fullscreen,
  defaultFullscreen = false,
  trigger,
  title,
  downloadText,
  openInNewTabText,
  fullscreenText,
  exitFullscreenText,
  unsupportedText,
  className,
  classNames,
  styles,
  style,
  footer,
  width = 880,
  onCancel,
  onOpenChange,
  onFullscreenChange,
  ...modalProps
}: TrueAdminUploadPreviewProps) {
  const { t } = useI18n();
  const { download } = useTrueAdminDownload();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const [innerFullscreen, setInnerFullscreen] = useState(defaultFullscreen);
  const mergedOpen = open ?? innerOpen;
  const mergedFullscreen = fullscreen ?? innerFullscreen;
  const mergedDownloadText = downloadText ?? t('upload.preview.download', '下载文件');
  const mergedOpenInNewTabText =
    openInNewTabText ?? t('upload.preview.openInNewTab', '新标签页打开');
  const mergedFullscreenText = fullscreenText ?? t('modal.action.fullscreen', '全屏');
  const mergedExitFullscreenText =
    exitFullscreenText ?? t('modal.action.exitFullscreen', '退出全屏');
  const mergedUnsupportedText =
    unsupportedText ?? t('upload.preview.unsupported', '当前文件暂不支持在线预览，请下载后查看。');

  const setMergedFullscreen = useCallback(
    (nextFullscreen: boolean) => {
      if (fullscreen === undefined) {
        setInnerFullscreen(nextFullscreen);
      }
      onFullscreenChange?.(nextFullscreen);
    },
    [fullscreen, onFullscreenChange],
  );

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setInnerOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setMergedFullscreen(false);
    }
  };

  const modalRootStyle = { ...styles?.root, ...style };

  const displayName = file ? getUploadPreviewDisplayName(file) : undefined;
  const openInNewTab = useCallback(() => {
    if (!file) {
      return;
    }

    window.open(file.url, '_blank', 'noopener,noreferrer');
  }, [file]);

  const downloadPreviewFile = useCallback(() => {
    if (!file) {
      return;
    }

    void download(file.url, { filename: displayName });
  }, [displayName, download, file]);

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
      <TrueAdminModal
        {...modalProps}
        allowFullscreen
        bodyPadding={false}
        className={['trueadmin-upload-preview', classNames?.root, className]
          .filter(Boolean)
          .join(' ')}
        footer={
          footer ??
          (file ? (
            <UploadPreviewFooter
              downloadText={mergedDownloadText}
              file={file}
              openInNewTabText={mergedOpenInNewTabText}
              onDownload={downloadPreviewFile}
              onOpenInNewTab={openInNewTab}
            />
          ) : null)
        }
        fullscreen={mergedFullscreen}
        fullscreenText={mergedFullscreenText}
        exitFullscreenText={mergedExitFullscreenText}
        open={mergedOpen}
        style={modalRootStyle}
        title={title ?? displayName}
        width={width}
        onCancel={(event) => {
          setOpen(false);
          onCancel?.(event);
        }}
        onFullscreenChange={setMergedFullscreen}
      >
        <div
          className={['trueadmin-upload-preview-body', classNames?.body].filter(Boolean).join(' ')}
          style={styles?.body}
        >
          <UploadPreviewBody
            displayName={displayName}
            downloadText={mergedDownloadText}
            file={file}
            styles={styles}
            unsupportedText={mergedUnsupportedText}
            onDownload={downloadPreviewFile}
          />
        </div>
      </TrueAdminModal>
    </>
  );
}
