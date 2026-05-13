import { Result, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { useOptionalWorkspaceViewport } from '@/core/layout/WorkspaceViewport';
import { TrueAdminLoadingContainer } from '@/core/loading';
import { PageTransition } from './PageTransition';
import './page.css';

export type TrueAdminPageLayout = 'natural' | 'workspace';
export type TrueAdminPageContentAlign = 'start' | 'center' | 'stretch';

export type TrueAdminPageProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  header?: ReactNode;
  showHeader?: boolean;
  loading?: boolean;
  loadingTip?: ReactNode;
  initialLoadingHeight?: number | string;
  keepLoadingChildren?: boolean;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  contentPadding?: boolean;
  layout?: TrueAdminPageLayout;
  fullHeight?: boolean;
  contentAlign?: TrueAdminPageContentAlign;
  contentWidth?: number | string;
};

function toCssSize(value?: number | string) {
  if (typeof value === 'number') {
    return `${String(value)}px`;
  }

  return value;
}

function PageErrorFallback() {
  return (
    <Result status="500" title="页面加载失败" subTitle="请刷新页面，或联系管理员查看错误日志。" />
  );
}

function PageHeader({
  description,
  extra,
  title,
}: Pick<TrueAdminPageProps, 'description' | 'extra' | 'title'>) {
  if (!title && !description && !extra) {
    return null;
  }

  return (
    <div className="trueadmin-page-header">
      <div className="trueadmin-page-header-main">
        {title ? <Typography.Title level={4}>{title}</Typography.Title> : null}
        {description ? (
          <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <div className="trueadmin-page-header-extra">{extra}</div> : null}
    </div>
  );
}

export function TrueAdminPage({
  children,
  className,
  style,
  contentPadding,
  layout = 'natural',
  title,
  description,
  extra,
  header,
  showHeader = false,
  loading,
  loadingTip,
  initialLoadingHeight,
  keepLoadingChildren = true,
  bodyClassName,
  bodyStyle,
  fullHeight = false,
  contentAlign = 'stretch',
  contentWidth,
}: TrueAdminPageProps) {
  const location = useLocation();
  const viewport = useOptionalWorkspaceViewport();
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const shouldUsePadding = contentPadding ?? routeLayout.contentPadding ?? true;
  const isWorkspaceLayout = layout === 'workspace';
  const shouldFillBody = fullHeight || isWorkspaceLayout;
  const classes = [
    'trueadmin-page',
    shouldUsePadding ? 'has-padding' : '',
    fullHeight ? 'is-full-height' : '',
    isWorkspaceLayout ? 'is-workspace' : '',
    contentAlign !== 'stretch' || contentWidth ? 'has-content-width' : '',
    contentAlign !== 'stretch' ? `content-align-${contentAlign}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const bodyClasses = ['trueadmin-page-body', shouldFillBody ? 'is-fill' : '', bodyClassName]
    .filter(Boolean)
    .join(' ');
  const headerNode =
    header ??
    (showHeader ? <PageHeader title={title} description={description} extra={extra} /> : null);
  const pageStyle = {
    ...style,
    '--trueadmin-page-workspace-height':
      isWorkspaceLayout && viewport ? `${String(viewport.pageHeight)}px` : undefined,
    '--trueadmin-page-content-width': toCssSize(contentWidth),
  } as CSSProperties;

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <PageTransition className={isWorkspaceLayout ? 'is-workspace' : undefined}>
        <main className={classes} style={pageStyle}>
          {headerNode}
          {loading === undefined ? (
            <div className={bodyClasses} style={bodyStyle}>
              {children}
            </div>
          ) : (
            <TrueAdminLoadingContainer
              loading={loading}
              tip={loadingTip}
              initialLoadingHeight={initialLoadingHeight}
              keepChildren={keepLoadingChildren}
              className={bodyClasses}
              style={bodyStyle}
            >
              {children}
            </TrueAdminLoadingContainer>
          )}
        </main>
      </PageTransition>
    </ErrorBoundary>
  );
}
