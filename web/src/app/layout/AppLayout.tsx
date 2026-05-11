import { Layout, Result, Spin } from 'antd';
import { useLocation } from 'react-router';
import { PreferenceBootstrap } from '@/app/providers/PreferenceBootstrap';
import { useI18n } from '@/core/i18n/I18nProvider';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { mergeFrontendMenus } from '@/core/menu/mergeFrontendMenus';
import { useLayoutStore } from '@/core/store/layoutStore';
import { useRouteTabs } from '@/core/tabs/useRouteTabs';
import { findMenuMatch, getSideOpenKeys, resolveActiveRoot, toRuntimeMenus } from './AppLayoutMenu';
import { ClassicLayout, ColumnsLayout, MixedLayout } from './AppLayoutViews';

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
