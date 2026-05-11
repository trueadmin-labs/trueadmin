import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { appConfig } from '@config/index';
import { Button, Layout, Result, Spin } from 'antd';
import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { PreferenceBootstrap } from '@/app/providers/PreferenceBootstrap';
import { useI18n } from '@/core/i18n/I18nProvider';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { WorkspaceScrollRestoration } from '@/core/layout/WorkspaceScrollRestoration';
import { useWorkspaceViewport, WorkspaceViewportProvider } from '@/core/layout/WorkspaceViewport';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { mergeFrontendMenus } from '@/core/menu/mergeFrontendMenus';
import { type LayoutMode, useLayoutStore } from '@/core/store/layoutStore';
import { AppTabsBar } from '@/core/tabs/AppTabsBar';
import { useRouteTabs } from '@/core/tabs/useRouteTabs';
import {
  AppColumnRootMenu,
  AppMenu,
  AppRootMenu,
  findMenuMatch,
  getSideOpenKeys,
  type MenuMatch,
  type RuntimeMenuNode,
  resolveActiveRoot,
  toRuntimeMenus,
} from './AppLayoutMenu';
import { useHeaderActions } from './RightContent';

const { Sider, Header } = Layout;

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

function WorkspaceContent({
  outletKey,
  scrollKey,
  showFooter,
  showTabs,
}: {
  outletKey: string;
  scrollKey: string;
  showFooter: boolean;
  showTabs: boolean;
}) {
  const { containerRef } = useWorkspaceViewport();

  return (
    <>
      <WorkspaceScrollRestoration containerRef={containerRef} scrollKey={scrollKey} />
      <div className="trueadmin-shell-content-column" data-tabs-visible={showTabs}>
        <div className="trueadmin-shell-page-slot">
          <Outlet key={outletKey} />
        </div>
        {showFooter ? <AppFooter /> : null}
      </div>
    </>
  );
}

function AppContentFrame({
  activeTabKey,
  outletKey,
  scrollKey,
  showFooter,
  showTabs,
}: {
  activeTabKey?: string;
  outletKey: string;
  scrollKey: string;
  showFooter: boolean;
  showTabs: boolean;
}) {
  return (
    <>
      {showTabs ? <AppTabsBar activeKey={activeTabKey} /> : null}
      <WorkspaceViewportProvider
        showFooter={showFooter}
        showTabs={showTabs}
        className="trueadmin-shell-content-scroll"
      >
        <WorkspaceContent
          outletKey={outletKey}
          scrollKey={scrollKey}
          showFooter={showFooter}
          showTabs={showTabs}
        />
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
  activeTabKey,
  outletKey,
  scrollKey,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  showFooter: boolean;
  showTabs: boolean;
  activeTabKey?: string;
  outletKey: string;
  scrollKey: string;
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
        <AppContentFrame
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
          showFooter={showFooter}
          showTabs={showTabs}
        />
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
  activeTabKey,
  outletKey,
  scrollKey,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  activeRoot?: RuntimeMenuNode;
  sideOpenKeys: string[];
  showFooter: boolean;
  showTabs: boolean;
  activeTabKey?: string;
  outletKey: string;
  scrollKey: string;
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
          <AppContentFrame
            activeTabKey={activeTabKey}
            outletKey={outletKey}
            scrollKey={scrollKey}
            showFooter={showFooter}
            showTabs={showTabs}
          />
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
  activeTabKey,
  outletKey,
  scrollKey,
}: {
  collapsed: boolean;
  darkMode: boolean;
  runtimeMenus: RuntimeMenuNode[];
  menuMatch: MenuMatch | null;
  activeRoot?: RuntimeMenuNode;
  sideOpenKeys: string[];
  showFooter: boolean;
  showTabs: boolean;
  activeTabKey?: string;
  outletKey: string;
  scrollKey: string;
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
        <AppContentFrame
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
          showFooter={showFooter}
          showTabs={showTabs}
        />
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
  const { activeKey: activeTabKey, activeTab } = useRouteTabs({
    menus: runtimeMenus,
    pathname: location.pathname,
    t,
  });
  const outletKey = activeTab ? `${activeTab.key}:${activeTab.refreshKey}` : location.pathname;
  const scrollKey = activeTabKey ?? `${location.pathname}${location.search}`;
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
      <PreferenceBootstrap />
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
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
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
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
        />
      ) : (
        <ClassicLayout
          collapsed={collapsed}
          darkMode={darkMode}
          runtimeMenus={runtimeMenus}
          menuMatch={menuMatch}
          showFooter={effectiveShowFooter}
          showTabs={effectiveShowTabs}
          activeTabKey={activeTabKey}
          outletKey={outletKey}
          scrollKey={scrollKey}
        />
      )}
    </Layout>
  );
}
