import { PageContainer, type PageContainerProps } from '@ant-design/pro-components';
import { Result } from 'antd';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { WorkspaceViewportProvider } from '@/core/layout/WorkspaceViewport';
import { PageTransition } from './PageTransition';

export type TrueAdminPageProps = PageContainerProps & {
  children: ReactNode;
};

function PageErrorFallback() {
  return (
    <Result status="500" title="页面加载失败" subTitle="请刷新页面，或联系管理员查看错误日志。" />
  );
}

export function TrueAdminPage({ children, ...props }: TrueAdminPageProps) {
  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      <WorkspaceViewportProvider>
        <PageTransition>
          <PageContainer {...props}>{children}</PageContainer>
        </PageTransition>
      </WorkspaceViewportProvider>
    </ErrorBoundary>
  );
}
