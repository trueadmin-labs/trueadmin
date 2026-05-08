import type { ModalSemanticStyles, ModalStylesType } from 'antd/es/modal/interface';
import type { CSSProperties, ReactNode } from 'react';
import {
  TrueAdminScrollShadow,
  type TrueAdminScrollShadowProps,
} from '@/core/scroll/TrueAdminScrollShadow';
import { useLayoutStore } from '@/core/store/layoutStore';
import { TrueAdminModal, type TrueAdminModalProps } from './TrueAdminModal';

const DEFAULT_PAGE_MODAL_WIDTH = 'min(1440px, calc(100vw - 48px))';
const DEFAULT_CONTENT_PADDING_BLOCK = '20px';
const DEFAULT_CONTENT_PADDING_INLINE = '24px';

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

export type TrueAdminPageModalProps = TrueAdminModalProps & {
  children?: ReactNode;
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
  styles,
  width = DEFAULT_PAGE_MODAL_WIDTH,
  ...modalProps
}: TrueAdminPageModalProps) {
  const darkMode = useLayoutStore((state) => state.darkMode);
  const modalStyles = mergePageModalStyles(styles);

  return (
    <TrueAdminModal
      {...modalProps}
      centered={centered}
      className={['trueadmin-page-modal', darkMode ? 'is-dark' : '', className]
        .filter(Boolean)
        .join(' ')}
      destroyOnHidden={destroyOnHidden}
      contentPaddingBlock={contentPaddingBlock}
      contentPaddingInline={contentPaddingInline}
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
    </TrueAdminModal>
  );
}
