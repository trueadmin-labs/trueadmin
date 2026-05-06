import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { appConfig } from '@config/index';
import type { MenuProps } from 'antd';
import { Button, Layout, Menu, Result, Spin } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { useWorkspaceViewport, WorkspaceViewportProvider } from '@/core/layout/WorkspaceViewport';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { mergeFrontendMenus } from '@/core/menu/mergeFrontendMenus';
import type { BackendMenu } from '@/core/menu/types';
import { useLayoutStore } from '@/core/store/layoutStore';
import { useHeaderActions } from './RightContent';

const { Sider, Header } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

type RuntimeMenuNode = {
  key: string;
  path: string;
  label: string;
  icon?: ReactNode;
  children?: RuntimeMenuNode[];
};

type MenuMatch = {
  selectedKey: string;
  openKeys: string[];
  breadcrumb: string[];
};

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const toRuntimeMenus = (
  menus: BackendMenu[] | undefined,
  t: (key?: string, fallback?: string) => string,
): RuntimeMenuNode[] =>
  (menus ?? [])
    .filter((menu) => menu.type !== 'button' && menu.status !== 'disabled')
    .map((menu) => ({
      key: menu.path || menu.code,
      path: menu.path,
      label: t(menu.i18n, menu.title),
      icon: <IconRenderer name={menu.icon || menu.code} />,
      children: toRuntimeMenus(menu.children, t),
    }));

const toMenuItems = (menus: RuntimeMenuNode[]): MenuItem[] =>
  menus.map((menu) => ({
    key: menu.key,
    icon: menu.icon,
    label: menu.label,
    children: menu.children?.length ? toMenuItems(menu.children) : undefined,
  }));

const toMenuPathMap = (menus: RuntimeMenuNode[], pathMap = new Map<string, string>()) => {
  for (const menu of menus) {
    pathMap.set(menu.key, menu.path || menu.key);
    toMenuPathMap(menu.children ?? [], pathMap);
  }

  return pathMap;
};

const findMenuMatch = (
  menus: RuntimeMenuNode[],
  pathname: string,
  parents: string[] = [],
  labels: string[] = [],
): MenuMatch | null => {
  const currentPath = normalizePath(pathname);

  for (const menu of menus) {
    const nextLabels = [...labels, menu.label];
    if (normalizePath(menu.path) === currentPath) {
      return {
        selectedKey: menu.key,
        openKeys: parents,
        breadcrumb: nextLabels,
      };
    }

    const childMatch = findMenuMatch(
      menu.children ?? [],
      pathname,
      [...parents, menu.key],
      nextLabels,
    );
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
};

const getRootSubmenuKeys = (menus: RuntimeMenuNode[]) =>
  menus.filter((menu) => menu.children?.length).map((menu) => menu.key);

function AppBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="trueadmin-shell-brand">
      <span className="trueadmin-brand-mark" aria-hidden="true">
        T
      </span>
      {!collapsed ? <span className="trueadmin-shell-brand-text">{appConfig.name}</span> : null}
    </div>
  );
}

function AppSideMenu({
  menus,
  selectedKey,
  selectedOpenKeys,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
  selectedOpenKeys: string[];
}) {
  const navigate = useNavigate();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const [openKeys, setOpenKeys] = useState<string[]>(selectedOpenKeys);
  const rootSubmenuKeys = useMemo(() => getRootSubmenuKeys(menus), [menus]);
  const menuPathMap = useMemo(() => toMenuPathMap(menus), [menus]);
  const selectedOpenKeysKey = selectedOpenKeys.join('\0');

  useEffect(() => {
    setOpenKeys(selectedOpenKeys);
  }, [selectedOpenKeysKey]);

  const handleOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
      return;
    }

    const activeRootKey = keys.find((key) => rootSubmenuKeys.includes(key));
    setOpenKeys(
      activeRootKey
        ? keys.filter((key) => key === activeRootKey || !rootSubmenuKeys.includes(key))
        : keys,
    );
  };

  return (
    <div className="trueadmin-shell-menu-scroll">
      <Menu
        mode="inline"
        theme={darkMode ? 'dark' : 'light'}
        items={toMenuItems(menus)}
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={({ key }) => navigate(menuPathMap.get(String(key)) ?? String(key))}
      />
    </div>
  );
}

function AppHeaderBar({ breadcrumb }: { breadcrumb: string[] }) {
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);
  const showBreadcrumb = useLayoutStore((state) => state.showBreadcrumb);
  const location = useLocation();
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const headerActions = useHeaderActions();
  const shouldShowBreadcrumb = routeLayout.showBreadcrumb ?? showBreadcrumb;
  const breadcrumbText = breadcrumb.length > 0 ? breadcrumb.join(' / ') : location.pathname;

  return (
    <Header className="trueadmin-shell-header">
      <div className="trueadmin-shell-header-left">
        <Button
          aria-label={collapsed ? '展开菜单' : '收起菜单'}
          className="trueadmin-shell-collapse-button"
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
        {shouldShowBreadcrumb ? (
          <span className="trueadmin-shell-breadcrumb">{breadcrumbText}</span>
        ) : null}
      </div>
      <div className="trueadmin-shell-header-actions">{headerActions}</div>
    </Header>
  );
}

function AppTabsPlaceholder() {
  return <div className="trueadmin-shell-tabs" aria-hidden="true" />;
}

function AppFooter() {
  const { footerRef } = useWorkspaceViewport();

  return (
    <footer ref={footerRef} className="trueadmin-shell-footer">
      Copyright © 2026 TrueAdmin
    </footer>
  );
}

function AppContentFrame({ showFooter, showTabs }: { showFooter: boolean; showTabs: boolean }) {
  return (
    <>
      {showTabs ? <AppTabsPlaceholder /> : null}
      <WorkspaceViewportProvider
        showFooter={showFooter}
        showTabs={showTabs}
        className="trueadmin-shell-content-scroll"
      >
        <div className="trueadmin-shell-content-column" data-tabs-visible={showTabs}>
          <div className="trueadmin-shell-page-slot">
            <Outlet />
          </div>
          {showFooter ? <AppFooter /> : null}
        </div>
      </WorkspaceViewportProvider>
    </>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { t } = useI18n();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const darkMode = useLayoutStore((state) => state.darkMode);
  const showFooter = useLayoutStore((state) => state.showFooter);
  const showTabs = useLayoutStore((state) => state.showTabs);
  const layoutMode = useLayoutStore((state) => state.layoutMode);
  const { data: menus, isLoading, error } = useMenuTreeQuery();
  const mergedMenus = mergeFrontendMenus(menus);
  const runtimeMenus = toRuntimeMenus(mergedMenus, t);
  const menuMatch = findMenuMatch(runtimeMenus, location.pathname);
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const effectiveShowFooter = routeLayout.fullscreen
    ? false
    : (routeLayout.showFooter ?? showFooter);
  const effectiveShowTabs = routeLayout.fullscreen ? false : (routeLayout.showTabs ?? showTabs);
  const effectiveLayoutMode = layoutMode === 'classic' ? layoutMode : 'classic';
  const shellClassName = [
    'trueadmin-shell',
    darkMode ? 'is-dark' : 'is-light',
    collapsed ? 'is-collapsed' : '',
    `is-${effectiveLayoutMode}`,
  ]
    .filter(Boolean)
    .join(' ');

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
    <Layout className={shellClassName}>
      <Sider
        className="trueadmin-shell-sider"
        width={208}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <AppBrand collapsed={collapsed} />
        <AppSideMenu
          menus={runtimeMenus}
          selectedKey={menuMatch?.selectedKey}
          selectedOpenKeys={collapsed ? [] : (menuMatch?.openKeys ?? [])}
        />
      </Sider>
      <Layout className="trueadmin-shell-main">
        <AppHeaderBar breadcrumb={menuMatch?.breadcrumb ?? []} />
        <AppContentFrame showFooter={effectiveShowFooter} showTabs={effectiveShowTabs} />
      </Layout>
    </Layout>
  );
}
