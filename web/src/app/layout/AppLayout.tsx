import { type MenuDataItem, ProLayout } from '@ant-design/pro-components';
import { appConfig, layoutConfig } from '@config/index';
import { Result, Spin } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { mergeFrontendMenus } from '@/core/menu/mergeFrontendMenus';
import type { BackendMenu } from '@/core/menu/types';
import { useLayoutStore } from '@/core/store/layoutStore';
import { useHeaderActions } from './RightContent';

const toMenuData = (
  menus: BackendMenu[] | undefined,
  t: (key?: string, fallback?: string) => string,
): MenuDataItem[] =>
  (menus ?? [])
    .filter((menu) => menu.type !== 'button' && menu.status !== 'disabled')
    .map((menu) => ({
      key: menu.path || menu.code,
      path: menu.path,
      name: t(menu.i18n, menu.title),
      icon: <IconRenderer name={menu.icon || menu.code} />,
      children: toMenuData(menu.children, t),
    }));

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);
  const darkMode = useLayoutStore((state) => state.darkMode);
  const { data: menus, isLoading, error } = useMenuTreeQuery();
  const headerActions = useHeaderActions();
  const mergedMenus = mergeFrontendMenus(menus);

  if (isLoading) {
    return <Spin fullscreen description="正在加载工作台" />;
  }

  if (error) {
    return (
      <Result
        status="500"
        title="菜单加载失败"
        subTitle="请确认后端服务已启动，或使用 test mode 启用最小 Mock。"
      />
    );
  }

  return (
    <ProLayout
      title={appConfig.name}
      logo={
        <span className="trueadmin-brand-mark" aria-hidden="true">
          T
        </span>
      }
      layout={layoutConfig.layout}
      navTheme={darkMode ? 'realDark' : layoutConfig.navTheme}
      contentWidth={layoutConfig.contentWidth}
      fixedHeader={layoutConfig.fixedHeader}
      fixSiderbar={layoutConfig.fixSiderbar}
      splitMenus={layoutConfig.splitMenus}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      menuDataRender={() => toMenuData(mergedMenus, t)}
      menuItemRender={(item, dom) => (
        <button
          className="trueadmin-menu-button"
          type="button"
          onClick={() => {
            const path = item.path || String(item.key);
            navigate(path);
          }}
        >
          {dom}
        </button>
      )}
      actionsRender={() => headerActions}
    >
      <Outlet />
    </ProLayout>
  );
}
