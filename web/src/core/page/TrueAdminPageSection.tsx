import { Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { TrueAdminLoadingContainer } from '@/core/loading';
import './page.css';

type TrueAdminPageSectionPadding = boolean | 'horizontal' | 'vertical';

export type TrueAdminPageSectionProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  loading?: boolean;
  loadingTip?: ReactNode;
  initialLoadingHeight?: number | string;
  keepLoadingChildren?: boolean;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  fullHeight?: boolean;
  padding?: TrueAdminPageSectionPadding;
  surface?: boolean;
};

function getPaddingClassName(padding: TrueAdminPageSectionPadding) {
  if (padding === false) {
    return '';
  }

  if (padding === 'horizontal') {
    return 'has-horizontal-padding';
  }

  if (padding === 'vertical') {
    return 'has-vertical-padding';
  }

  return 'has-padding';
}

export function TrueAdminPageSection({
  children,
  title,
  description,
  extra,
  loading,
  loadingTip,
  initialLoadingHeight,
  keepLoadingChildren = true,
  className,
  bodyClassName,
  style,
  bodyStyle,
  fullHeight = false,
  padding = true,
  surface = false,
}: TrueAdminPageSectionProps) {
  const hasHeader = Boolean(title || description || extra);
  const sectionClassName = [
    'trueadmin-page-section',
    getPaddingClassName(padding),
    surface ? 'is-surface' : '',
    fullHeight ? 'is-full-height' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const sectionBodyClassName = [
    'trueadmin-page-section-body',
    fullHeight ? 'is-fill' : '',
    bodyClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClassName} style={style}>
      {hasHeader ? (
        <div className="trueadmin-page-section-header">
          <div className="trueadmin-page-section-header-main">
            {title ? <Typography.Title level={5}>{title}</Typography.Title> : null}
            {description ? (
              <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
            ) : null}
          </div>
          {extra ? <div className="trueadmin-page-section-header-extra">{extra}</div> : null}
        </div>
      ) : null}
      {loading === undefined ? (
        <div className={sectionBodyClassName} style={bodyStyle}>
          {children}
        </div>
      ) : (
        <TrueAdminLoadingContainer
          loading={loading}
          tip={loadingTip}
          initialLoadingHeight={initialLoadingHeight}
          keepChildren={keepLoadingChildren}
          className={sectionBodyClassName}
          style={bodyStyle}
        >
          {children}
        </TrueAdminLoadingContainer>
      )}
    </section>
  );
}
