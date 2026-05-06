import { Result } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { PageTransition } from './PageTransition';

export type TrueAdminPageProps = {
  children: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  className?: string;
  style?: CSSProperties;
  contentPadding?: boolean;
};

function PageErrorFallback() {
  return (
    <Result status="500" title="页面加载失败" subTitle="请刷新页面，或联系管理员查看错误日志。" />
  );
}

export function TrueAdminPage({ children, className, style, contentPadding }: TrueAdminPageProps) {
  const location = useLocation();
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const shouldUsePadding = contentPadding ?? routeLayout.contentPadding ?? true;
  const classes = ['trueadmin-page', shouldUsePadding ? 'has-padding' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <PageTransition>
        <main className={classes} style={style}>
          {children}
        </main>
      </PageTransition>
    </ErrorBoundary>
  );
}
