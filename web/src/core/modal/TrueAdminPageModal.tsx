import { Modal, type ModalProps } from 'antd';
import type { ModalSemanticStyles, ModalStylesType } from 'antd/es/modal/interface';
import type { CSSProperties, ReactNode } from 'react';
import {
  TrueAdminScrollShadow,
  type TrueAdminScrollShadowProps,
} from '@/core/scroll/TrueAdminScrollShadow';

const DEFAULT_PAGE_MODAL_WIDTH = 'min(1440px, calc(100vw - 48px))';
const DEFAULT_CONTENT_PADDING_BLOCK = '20px';
const DEFAULT_CONTENT_PADDING_INLINE = '24px';

const toSizeValue = (value: number | string) =>
  typeof value === 'number' ? `${String(value)}px` : value;

const mergePageModalStyles = (styles?: ModalStylesType): ModalStylesType => {
  const mergeBodyStyle = (nextStyles?: ModalSemanticStyles): ModalSemanticStyles => ({
    ...nextStyles,
    body: { overflow: 'hidden', padding: 0, ...nextStyles?.body },
  });

  if (typeof styles === 'function') {
    return (info) => mergeBodyStyle(styles(info));
  }

  return mergeBodyStyle(styles);
};

export type TrueAdminPageModalProps = ModalProps & {
  children?: ReactNode;
  contentPaddingBlock?: number | string;
  contentPaddingInline?: number | string;
  scrollClassName?: string;
  scrollContentClassName?: string;
  scrollContentStyle?: CSSProperties;
  scrollShadowProps?: Omit<
    TrueAdminScrollShadowProps,
    'children' | 'className' | 'contentClassName' | 'contentStyle'
  >;
};

export function TrueAdminPageModal({
  children,
  centered = true,
  className,
  contentPaddingBlock = DEFAULT_CONTENT_PADDING_BLOCK,
  contentPaddingInline = DEFAULT_CONTENT_PADDING_INLINE,
  destroyOnHidden = true,
  scrollClassName,
  scrollContentClassName,
  scrollContentStyle,
  scrollShadowProps,
  style,
  styles,
  width = DEFAULT_PAGE_MODAL_WIDTH,
  ...modalProps
}: TrueAdminPageModalProps) {
  const modalStyle = {
    '--trueadmin-modal-content-padding-block': toSizeValue(contentPaddingBlock),
    '--trueadmin-modal-content-padding-inline': toSizeValue(contentPaddingInline),
    ...style,
  } as CSSProperties;

  const modalStyles = mergePageModalStyles(styles);

  return (
    <Modal
      {...modalProps}
      centered={centered}
      className={['trueadmin-page-modal', className].filter(Boolean).join(' ')}
      destroyOnHidden={destroyOnHidden}
      style={modalStyle}
      styles={modalStyles}
      width={width}
    >
      <TrueAdminScrollShadow
        {...scrollShadowProps}
        className={scrollClassName}
        contentClassName={scrollContentClassName}
        contentStyle={scrollContentStyle}
      >
        {children}
      </TrueAdminScrollShadow>
    </Modal>
  );
}
