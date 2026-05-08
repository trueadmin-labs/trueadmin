import { CloseOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Modal, type ModalProps } from 'antd';
import type { ModalSemanticStyles, ModalStylesType } from 'antd/es/modal/interface';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';

const DEFAULT_MODAL_CONTENT_PADDING_BLOCK = '20px';
const DEFAULT_MODAL_CONTENT_PADDING_INLINE = '24px';

const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

const mergeModalStyles = (styles?: ModalStylesType): ModalStylesType => {
  const mergeStyles = (nextStyles?: ModalSemanticStyles): ModalSemanticStyles => ({
    ...nextStyles,
    container: { padding: 0, ...nextStyles?.container },
    header: {
      marginBottom: 0,
      paddingBlock: 'var(--trueadmin-modal-content-padding-block)',
      paddingInlineEnd: 'calc(var(--trueadmin-modal-content-padding-inline) + 72px)',
      paddingInlineStart: 'var(--trueadmin-modal-content-padding-inline)',
      ...nextStyles?.header,
    },
    body: { padding: 0, ...nextStyles?.body },
    footer: {
      marginTop: 0,
      paddingBlock: 'var(--trueadmin-modal-content-padding-block)',
      paddingInline: 'var(--trueadmin-modal-content-padding-inline)',
      ...nextStyles?.footer,
    },
  });

  if (typeof styles === 'function') {
    return (info) => mergeStyles(styles(info));
  }

  return mergeStyles(styles);
};

export type TrueAdminModalProps = ModalProps & {
  allowFullscreen?: boolean;
  contentPaddingBlock?: number | string;
  contentPaddingInline?: number | string;
  fullscreen?: boolean;
  defaultFullscreen?: boolean;
  fullscreenText?: ReactNode;
  exitFullscreenText?: ReactNode;
  closeText?: ReactNode;
  headerActions?: ReactNode;
  onFullscreenChange?: (fullscreen: boolean) => void;
};

export function TrueAdminModal({
  allowFullscreen = true,
  children,
  className,
  closeText,
  contentPaddingBlock = DEFAULT_MODAL_CONTENT_PADDING_BLOCK,
  contentPaddingInline = DEFAULT_MODAL_CONTENT_PADDING_INLINE,
  defaultFullscreen = false,
  exitFullscreenText,
  fullscreen,
  fullscreenText,
  headerActions,
  modalRender,
  onCancel,
  onFullscreenChange,
  style,
  styles,
  ...modalProps
}: TrueAdminModalProps) {
  const { t } = useI18n();
  const [innerFullscreen, setInnerFullscreen] = useState(defaultFullscreen);
  const mergedFullscreen = fullscreen ?? innerFullscreen;
  const mergedFullscreenText = fullscreenText ?? t('modal.action.fullscreen', '全屏');
  const mergedExitFullscreenText =
    exitFullscreenText ?? t('modal.action.exitFullscreen', '退出全屏');
  const mergedCloseText = closeText ?? t('modal.action.close', '关闭');
  const modalStyle = {
    '--trueadmin-modal-content-padding-block': toSizeValue(contentPaddingBlock),
    '--trueadmin-modal-content-padding-inline': toSizeValue(contentPaddingInline),
    ...style,
  } as CSSProperties;
  const modalStyles = mergeModalStyles(styles);

  const setMergedFullscreen = useCallback(
    (nextFullscreen: boolean) => {
      if (fullscreen === undefined) {
        setInnerFullscreen(nextFullscreen);
      }
      onFullscreenChange?.(nextFullscreen);
    },
    [fullscreen, onFullscreenChange],
  );

  const toggleFullscreen = useCallback(() => {
    setMergedFullscreen(!mergedFullscreen);
  }, [mergedFullscreen, setMergedFullscreen]);

  const closeModal = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onCancel?.(event);
    },
    [onCancel],
  );

  const headerActionNode = (
    <div className="trueadmin-modal-header-actions">
      {headerActions ? (
        <div className="trueadmin-modal-header-actions-extra">{headerActions}</div>
      ) : null}
      {allowFullscreen ? (
        <Button
          aria-label={String(mergedFullscreen ? mergedExitFullscreenText : mergedFullscreenText)}
          htmlType="button"
          icon={mergedFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          type="text"
          onClick={toggleFullscreen}
        />
      ) : null}
      <Button
        aria-label={String(mergedCloseText)}
        htmlType="button"
        icon={<CloseOutlined />}
        type="text"
        onClick={closeModal}
      />
    </div>
  );

  return (
    <Modal
      {...modalProps}
      className={['trueadmin-modal', mergedFullscreen ? 'is-fullscreen' : '', className]
        .filter(Boolean)
        .join(' ')}
      closable={false}
      modalRender={(modal) => {
        const renderedModal = modalRender ? modalRender(modal) : modal;
        return (
          <div className="trueadmin-modal-render-root">
            {renderedModal}
            {headerActionNode}
          </div>
        );
      }}
      onCancel={onCancel}
      style={modalStyle}
      styles={modalStyles}
      width={mergedFullscreen ? '100%' : modalProps.width}
    >
      {children}
    </Modal>
  );
}
