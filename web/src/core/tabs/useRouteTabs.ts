import { useEffect, useMemo } from 'react';
import { useTabsStore } from './tabsStore';
import {
  createDescriptorMap,
  createHomeDescriptor,
  createRouteDescriptor,
  getTabKey,
  type TabMenuNode,
} from './tabUtils';
import type { AppTab, TabDescriptor } from './types';

const isSameTabSnapshot = (left: AppTab, right: AppTab) =>
  left.key === right.key &&
  left.path === right.path &&
  left.title === right.title &&
  left.pinned === right.pinned &&
  left.home === right.home &&
  left.refreshKey === right.refreshKey &&
  left.openedAt === right.openedAt &&
  left.pinnedAt === right.pinnedAt;

const createStoredTab = (descriptor: TabDescriptor): AppTab => ({
  key: descriptor.key,
  path: descriptor.path,
  title: descriptor.title,
  icon: descriptor.icon,
  pinned: descriptor.pinned ?? descriptor.home ?? false,
  home: descriptor.home ?? false,
  refreshKey: 0,
  openedAt: Date.now(),
  pinnedAt: descriptor.pinned || descriptor.home ? Date.now() : undefined,
});

const mapStoredTab = (
  tab: AppTab,
  descriptors: Map<string, TabDescriptor>,
  homeDescriptor?: TabDescriptor,
) => {
  const isCurrentHome = homeDescriptor?.key === tab.key;
  const descriptor = descriptors.get(tab.key);
  if (!descriptor && !isCurrentHome) {
    return tab.home ? undefined : tab;
  }

  const nextHomeState = {
    home: isCurrentHome,
    pinned: isCurrentHome ? true : tab.home ? false : tab.pinned,
    pinnedAt: isCurrentHome ? (tab.pinnedAt ?? tab.openedAt) : tab.home ? undefined : tab.pinnedAt,
  };

  if (!descriptor) {
    return { ...tab, ...nextHomeState };
  }

  if (
    tab.path === descriptor.path &&
    tab.title === descriptor.title &&
    tab.icon &&
    tab.home === nextHomeState.home &&
    tab.pinned === nextHomeState.pinned &&
    tab.pinnedAt === nextHomeState.pinnedAt
  ) {
    return tab;
  }

  return {
    ...tab,
    ...nextHomeState,
    path: descriptor.path,
    title: descriptor.title,
    icon: tab.icon ?? descriptor.icon,
  };
};

export function useRouteTabs({
  menus,
  pathname,
  t,
}: {
  menus: TabMenuNode[];
  pathname: string;
  t: (key?: string, fallback?: string) => string;
}) {
  const descriptors = useMemo(() => createDescriptorMap(menus, t), [menus, t]);
  const homeDescriptor = useMemo(
    () => createHomeDescriptor(menus, descriptors, t),
    [menus, descriptors, t],
  );
  const routeDescriptor = useMemo(
    () => createRouteDescriptor(menus, pathname, t),
    [menus, pathname, t],
  );
  const tabs = useTabsStore((state) => state.tabs);
  const ensureTab = useTabsStore((state) => state.ensureTab);
  const replaceTabs = useTabsStore((state) => state.replaceTabs);
  const setActiveKey = useTabsStore((state) => state.setActiveKey);

  useEffect(() => {
    const nextTabs = tabs
      .map((tab) => mapStoredTab(tab, descriptors, homeDescriptor))
      .filter(Boolean) as AppTab[];

    if (homeDescriptor && !nextTabs.some((tab) => tab.key === homeDescriptor.key)) {
      nextTabs.unshift(createStoredTab(homeDescriptor));
    }

    const changed =
      nextTabs.length !== tabs.length ||
      nextTabs.some((tab, index) => !isSameTabSnapshot(tab, tabs[index]));

    if (changed) {
      replaceTabs(nextTabs);
    }
  }, [descriptors, homeDescriptor, replaceTabs, tabs]);

  useEffect(() => {
    if (homeDescriptor) {
      ensureTab(homeDescriptor, { active: false });
    }
  }, [ensureTab, homeDescriptor]);

  useEffect(() => {
    if (routeDescriptor) {
      ensureTab(routeDescriptor);
      return;
    }

    setActiveKey(undefined);
  }, [ensureTab, routeDescriptor, setActiveKey]);

  const activeKey = routeDescriptor?.key ?? getTabKey(pathname);
  const activeTab = useTabsStore((state) => state.tabs.find((tab) => tab.key === activeKey));

  return {
    activeKey,
    activeTab,
    descriptors,
    homeKey: homeDescriptor?.key,
  };
}
