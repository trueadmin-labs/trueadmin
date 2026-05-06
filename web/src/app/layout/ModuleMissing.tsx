import { PageContainer } from '@ant-design/pro-components';
import { Result, Spin } from 'antd';
import { useLocation } from 'react-router';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import type { BackendMenu } from '@/core/menu/types';
import { PageTransition } from '@/core/page/PageTransition';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const hasMenuPath = (menus: BackendMenu[] | undefined, pathname: string): boolean => {
  const currentPath = normalizePath(pathname);

  return (menus ?? []).some((menu) => {
    if (menu.type !== 'button' && normalizePath(menu.path) === currentPath) {
      return true;
    }

    return hasMenuPath(menu.children, pathname);
  });
};

export function ModuleMissing() {
  const location = useLocation();
  const { data: menus, isLoading } = useMenuTreeQuery();

  if (isLoading) {
    return <Spin fullscreen description="正在确认页面状态" />;
  }

  const menuExists = hasMenuPath(menus, location.pathname);

  if (!menuExists) {
    return (
      <PageTransition>
        <PageContainer title="404">
          <Result status="404" title="404" subTitle="页面不存在。" />
        </PageContainer>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageContainer title="页面未安装">
        <Result
          status="404"
          title="页面未安装"
          subTitle={`当前路径 ${location.pathname} 已由后端菜单下发，但前端模块还没有提供对应页面。`}
        />
      </PageContainer>
    </PageTransition>
  );
}
