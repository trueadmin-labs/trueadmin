import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { appConfig } from '@config/index';
import { Button, Layout } from 'antd';
import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { WorkspaceScrollRestoration } from '@/core/layout/WorkspaceScrollRestoration';
import { useWorkspaceViewport, WorkspaceViewportProvider } from '@/core/layout/WorkspaceViewport';
import { type LayoutMode, useLayoutStore } from '@/core/store/layoutStore';
import { AppRootMenu, type RuntimeMenuNode } from './AppLayoutMenu';
import { useHeaderActions } from './RightContent';
import { AppTabsBar } from './tabs/AppTabsBar';

const { Header } = Layout;

export function AppBrand({
  collapsed,
  compact = false,
}: {
  collapsed: boolean;
  compact?: boolean;
}) {
  return (
    <div className="trueadmin-shell-brand" data-collapsed={collapsed} data-compact={compact}>
      <span className="trueadmin-brand-mark" aria-hidden="true">
        T
      </span>
      {!collapsed ? <span className="trueadmin-shell-brand-text">{appConfig.name}</span> : null}
    </div>
  );
}

export function AppHeaderBar({
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

export function SiderFrame({ children }: { children: ReactNode }) {
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

export function AppContentFrame({
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
