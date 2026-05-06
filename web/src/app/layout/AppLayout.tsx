import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { appConfig } from '@config/index';
import type { MenuProps } from 'antd';
import { Button, Layout, Menu, Result, Spin, Tooltip } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { useWorkspaceViewport, WorkspaceViewportProvider } from '@/core/layout/WorkspaceViewport';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { mergeFrontendMenus } from '@/core/menu/mergeFrontendMenus';
import type { BackendMenu } from '@/core/menu/types';
import { type LayoutMode, useLayoutStore } from '@/core/store/layoutStore';
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

const toRootMenuItems = (menus: RuntimeMenuNode[]): MenuItem[] =>
  menus.map((menu) => ({
    key: menu.key,
    icon: menu.icon,
    label: menu.label,
  }));

const toMenuPathMap = (menus: RuntimeMenuNode[], pathMap = new Map<string, string>()) => {
  for (const menu of menus) {
    pathMap.set(menu.key, menu.path || menu.key);
    toMenuPathMap(menu.children ?? [], pathMap);
  }

  return pathMap;
};

const getFirstNavigablePath = (menu: RuntimeMenuNode): string => {
  const firstChild = menu.children?.[0];

  return firstChild ? getFirstNavigablePath(firstChild) : menu.path || menu.key;
};

const toRootMenuPathMap = (menus: RuntimeMenuNode[]) => {
  const pathMap = new Map<string, string>();

  for (const menu of menus) {
    pathMap.set(menu.key, getFirstNavigablePath(menu));
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

const findMenuByKey = (menus: RuntimeMenuNode[], key?: string): RuntimeMenuNode | undefined => {
  if (!key) {
    return undefined;
  }

  for (const menu of menus) {
    if (menu.key === key) {
      return menu;
    }

    const child = findMenuByKey(menu.children ?? [], key);
    if (child) {
      return child;
    }
  }

  return undefined;
};

const getRootSubmenuKeys = (menus: RuntimeMenuNode[]) =>
  menus.filter((menu) => menu.children?.length).map((menu) => menu.key);

const resolveActiveRoot = (menus: RuntimeMenuNode[], menuMatch: MenuMatch | null) => {
  const rootKeys = menus.map((menu) => menu.key);
  const matchedRootKey = menuMatch?.openKeys[0] ?? menuMatch?.selectedKey;

  if (matchedRootKey && rootKeys.includes(matchedRootKey)) {
    return findMenuByKey(menus, matchedRootKey) ?? menus[0];
  }

  return menus[0];
};

const getSideOpenKeys = (menuMatch: MenuMatch | null, activeRootKey?: string) =>
  (menuMatch?.openKeys ?? []).filter((key) => key !== activeRootKey);

function AppBrand({ collapsed, compact = false }: { collapsed: boolean; compact?: boolean }) {
  return (
    <div className="trueadmin-shell-brand" data-collapsed={collapsed} data-compact={compact}>
      <span className="trueadmin-brand-mark" aria-hidden="true">
        T
      </span>
      {!collapsed ? <span className="trueadmin-shell-brand-text">{appConfig.name}</span> : null}
    </div>
  );
}

function AppMenu({
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

function AppRootMenu({
  menus,
  selectedKey,
  variant,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
  variant: 'top' | 'columns';
}) {
  const navigate = useNavigate();
  const darkMode = useLayoutStore((state) => state.darkMode);
  const menuPathMap = useMemo(() => toRootMenuPathMap(menus), [menus]);

  return (
    <Menu
      className={`trueadmin-shell-root-menu is-${variant}`}
      mode={variant === 'top' ? 'horizontal' : 'vertical'}
      theme={darkMode ? 'dark' : 'light'}
      items={toRootMenuItems(menus)}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={({ key }) => navigate(menuPathMap.get(String(key)) ?? String(key))}
    />
  );
}

function AppColumnRootMenu({
  menus,
  selectedKey,
}: {
  menus: RuntimeMenuNode[];
  selectedKey?: string;
}) {
  const navigate = useNavigate();
  const menuPathMap = useMemo(() => toRootMenuPathMap(menus), [menus]);

  return (
    <nav className="trueadmin-shell-column-root-menu" aria-label="一级菜单">
      {menus.map((menu) => {
        const selected = menu.key === selectedKey;

        return (
          <Tooltip key={menu.key} title={menu.label} placement="right">
            <button
              type="button"
              className="trueadmin-shell-column-root-item"
              data-selected={selected}
              aria-label={menu.label}
              aria-current={selected ? 'page' : undefined}
              onClick={() => navigate(menuPathMap.get(menu.key) ?? menu.path ?? menu.key)}
            >
              <span className="trueadmin-shell-column-root-icon" aria-hidden="true">
                {menu.icon}
              </span>
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function AppHeaderBar({
  breadcrumb,
  layoutMode,
  rootMenus,
  activeRootKey,
}: {
  breadcrumb: string[];
  layoutMode: LayoutMode;
  rootMenus: RuntimeMenuNode[];
  activeRootKey?: string;
}) {
  const showBreadcrumb = useLayoutStore((state) => state.showBreadcrumb);
  const location = useLocation();
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const headerActions = useHeaderActions();
  const shouldShowBreadcrumb = routeLayout.showBreadcrumb ?? showBreadcrumb;
  const breadcrumbText = breadcrumb.length > 0 ? breadcrumb.join(' / ') : location.pathname;
  const shouldShowTopMenu = layoutMode === 'mixed';

  return (
    <Header className="trueadmin-shell-header" data-layout-mode={layoutMode}>
      <div className="trueadmin-shell-header-left">
        {shouldShowTopMenu ? <AppBrand collapsed={false} /> : null}
        {shouldShowTopMenu ? (
          <AppRootMenu menus={rootMenus} selectedKey={activeRootKey} variant="top" />
        ) : null}
        {shouldShowBreadcrumb ? (
          <span className="trueadmin-shell-breadcrumb">{breadcrumbText}</span>
        ) : null}
      </div>
      {shouldShowTopMenu && shouldShowBreadcrumb ? (
        <span className="trueadmin-shell-header-divider" aria-hidden="true" />
      ) : null}
      <div className="trueadmin-shell-header-actions">{headerActions}</div>
    </Header>
  );
}

function AppTabsPlaceholder() {
  return <div className="trueadmin-shell-tabs" aria-hidden="true" />;
}

function SiderCollapseTrigger() {
  const collapsed = useLayoutStore((state) => state.collapsed);
  const setCollapsed = useLayoutStore((state) => state.setCollapsed);

  return (
    <div className="trueadmin-shell-sider-trigger">
      <Button
        aria-label={collapsed ? '展开菜单' : '收起菜单'}
        className="trueadmin-shell-collapse-button"
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
      />
    </div>
  );
}

function SiderFrame({ children }: { children: ReactNode }) {
  return (
    <div className="trueadmin-shell-sider-frame">
      {children}
      <SiderCollapseTrigger />
    </div>
  );
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

function ClassicLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  showFooter,
  showTabs,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  showFooter: boolean;
  showTabs: boolean;
}) {
  return (
    <>
      <Sider
        className="trueadmin-shell-sider"
        width={208}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <AppBrand collapsed={collapsed} />
        <SiderFrame>
          <AppMenu
            menus={runtimeMenus}
            selectedKey={menuMatch?.selectedKey}
            selectedOpenKeys={collapsed ? [] : (menuMatch?.openKeys ?? [])}
          />
        </SiderFrame>
      </Sider>
      <Layout className="trueadmin-shell-main">
        <AppHeaderBar
          breadcrumb={menuMatch?.breadcrumb ?? []}
          layoutMode="classic"
          rootMenus={runtimeMenus}
          activeRootKey={resolveActiveRoot(runtimeMenus, menuMatch)?.key}
        />
        <AppContentFrame showFooter={showFooter} showTabs={showTabs} />
      </Layout>
    </>
  );
}

function MixedLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  activeRoot,
  sideOpenKeys,
  showFooter,
  showTabs,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  activeRoot?: RuntimeMenuNode;
  sideOpenKeys: string[];
  showFooter: boolean;
  showTabs: boolean;
}) {
  const sideMenus = activeRoot?.children?.length
    ? activeRoot.children
    : activeRoot
      ? [activeRoot]
      : [];

  return (
    <>
      <AppHeaderBar
        breadcrumb={menuMatch?.breadcrumb ?? []}
        layoutMode="mixed"
        rootMenus={runtimeMenus}
        activeRootKey={activeRoot?.key}
      />
      <Layout className="trueadmin-shell-mixed-body">
        <Sider
          className="trueadmin-shell-sider trueadmin-shell-sider-sub"
          width={208}
          collapsedWidth={64}
          collapsed={collapsed}
          trigger={null}
          theme={darkMode ? 'dark' : 'light'}
        >
          <SiderFrame>
            <AppMenu
              menus={sideMenus}
              selectedKey={menuMatch?.selectedKey}
              selectedOpenKeys={collapsed ? [] : sideOpenKeys}
            />
          </SiderFrame>
        </Sider>
        <Layout className="trueadmin-shell-main">
          <AppContentFrame showFooter={showFooter} showTabs={showTabs} />
        </Layout>
      </Layout>
    </>
  );
}

function ColumnsLayout({
  collapsed,
  darkMode,
  runtimeMenus,
  menuMatch,
  activeRoot,
  sideOpenKeys,
  showFooter,
  showTabs,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  activeRoot?: RuntimeMenuNode;
  sideOpenKeys: string[];
  showFooter: boolean;
  showTabs: boolean;
}) {
  const sideMenus = activeRoot?.children?.length
    ? activeRoot.children
    : activeRoot
      ? [activeRoot]
      : [];

  return (
    <>
      <Sider
        className="trueadmin-shell-column-rail"
        width={64}
        collapsedWidth={64}
        collapsed={false}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <AppBrand collapsed compact />
        <div className="trueadmin-shell-column-root-scroll">
          <AppColumnRootMenu menus={runtimeMenus} selectedKey={activeRoot?.key} />
        </div>
      </Sider>
      <Sider
        className="trueadmin-shell-sider trueadmin-shell-sider-sub trueadmin-shell-column-sub"
        width={176}
        collapsedWidth={64}
        collapsed={collapsed}
        trigger={null}
        theme={darkMode ? 'dark' : 'light'}
      >
        <div className="trueadmin-shell-column-sub-title" title={activeRoot?.label}>
          {activeRoot?.label}
        </div>
        <SiderFrame>
          <AppMenu
            menus={sideMenus}
            selectedKey={menuMatch?.selectedKey}
            selectedOpenKeys={collapsed ? [] : sideOpenKeys}
          />
        </SiderFrame>
      </Sider>
      <Layout className="trueadmin-shell-main">
        <AppHeaderBar
          breadcrumb={menuMatch?.breadcrumb ?? []}
          layoutMode="columns"
          rootMenus={runtimeMenus}
          activeRootKey={activeRoot?.key}
        />
        <AppContentFrame showFooter={showFooter} showTabs={showTabs} />
      </Layout>
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
  const activeRoot = resolveActiveRoot(runtimeMenus, menuMatch);
  const sideOpenKeys = getSideOpenKeys(menuMatch, activeRoot?.key);
  const shellClassName = [
    'trueadmin-shell',
    darkMode ? 'is-dark' : 'is-light',
    collapsed ? 'is-collapsed' : '',
    `is-${layoutMode}`,
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
      {layoutMode === 'mixed' ? (
        <MixedLayout
          collapsed={collapsed}
          darkMode={darkMode}
          runtimeMenus={runtimeMenus}
          menuMatch={menuMatch}
          activeRoot={activeRoot}
          sideOpenKeys={sideOpenKeys}
          showFooter={effectiveShowFooter}
          showTabs={effectiveShowTabs}
        />
      ) : layoutMode === 'columns' ? (
        <ColumnsLayout
          collapsed={collapsed}
          darkMode={darkMode}
          runtimeMenus={runtimeMenus}
          menuMatch={menuMatch}
          activeRoot={activeRoot}
          sideOpenKeys={sideOpenKeys}
          showFooter={effectiveShowFooter}
          showTabs={effectiveShowTabs}
        />
      ) : (
        <ClassicLayout
          collapsed={collapsed}
          darkMode={darkMode}
          runtimeMenus={runtimeMenus}
          menuMatch={menuMatch}
          showFooter={effectiveShowFooter}
          showTabs={effectiveShowTabs}
        />
      )}
    </Layout>
  );
}
