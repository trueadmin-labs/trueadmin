import { useMemo } from 'react';
import { useLocation } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { getRouteLayoutMeta } from '@/core/layout/routeLayoutMeta';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import { useLayoutStore } from '@/core/store/layoutStore';
import { findMenuMatch, getSideOpenKeys, resolveActiveRoot, toRuntimeMenus } from './AppLayoutMenu';
import { useRouteTabs } from './tabs/useRouteTabs';

export function useAppLayoutController() {
  const location = useLocation();
  const { t } = useI18n();
  const collapsed = useLayoutStore((state) => state.collapsed);
  const darkMode = useLayoutStore((state) => state.darkMode);
  const showFooter = useLayoutStore((state) => state.showFooter);
  const showTabs = useLayoutStore((state) => state.showTabs);
  const layoutMode = useLayoutStore((state) => state.layoutMode);
  const { data: menus, isLoading, error } = useMenuTreeQuery();
  const runtimeMenus = useMemo(() => toRuntimeMenus(menus ?? [], t), [menus, t]);
  const menuMatch = useMemo(
    () => findMenuMatch(runtimeMenus, location.pathname),
    [runtimeMenus, location.pathname],
  );
  const routeLayout = getRouteLayoutMeta(location.pathname);
  const effectiveShowFooter = routeLayout.fullscreen
    ? false
    : (routeLayout.showFooter ?? showFooter);
  const effectiveShowTabs = routeLayout.fullscreen ? false : (routeLayout.showTabs ?? showTabs);
  const activeRoot = useMemo(
    () => resolveActiveRoot(runtimeMenus, menuMatch),
    [runtimeMenus, menuMatch],
  );
  const sideOpenKeys = useMemo(
    () => getSideOpenKeys(menuMatch, activeRoot?.key),
    [menuMatch, activeRoot?.key],
  );
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

  return {
    activeRoot,
    activeTabKey,
    collapsed,
    darkMode,
    error,
    isLoading,
    layoutMode,
    menuMatch,
    outletKey,
    runtimeMenus,
    scrollKey,
    shellClassName,
    showFooter: effectiveShowFooter,
    showTabs: effectiveShowTabs,
    sideOpenKeys,
  };
}
