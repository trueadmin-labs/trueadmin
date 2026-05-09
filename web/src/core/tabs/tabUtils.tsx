import { appConfig } from '@config/index';
import type { ReactNode } from 'react';
import { matchPath } from 'react-router';
import { IconRenderer } from '@/core/icon/IconRenderer';
import { frontendRoutes } from '@/core/module/registry';
import type { FrontendRoute } from '@/core/module/types';
import type { TabDescriptor } from './types';

export type TabMenuNode = {
  key: string;
  path: string;
  id?: number;
  code?: string;
  type?: 'directory' | 'menu' | 'button' | 'link';
  openMode?: 'blank' | 'self' | 'iframe' | '';
  label: string;
  icon?: ReactNode;
  children?: TabMenuNode[];
};

type AppConfigWithHome = typeof appConfig & {
  homePath?: string;
  homeTitle?: string;
  defaultHome?: string;
};

const appHomeConfig = appConfig as AppConfigWithHome;

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const getTabKey = (pathname: string) => normalizePath(pathname);

const toIframeLinkPath = (menu: TabMenuNode): string =>
  `/system/link-frame/${encodeURIComponent(String(menu.id ?? menu.code ?? menu.key))}`;

const findFirstNavigableMenu = (menus: TabMenuNode[]): TabMenuNode | undefined => {
  for (const menu of menus) {
    const child = findFirstNavigableMenu(menu.children ?? []);
    if (child) {
      return child;
    }

    if (menu.path) {
      return menu;
    }
  }

  return undefined;
};

export const findMenuByPath = (menus: TabMenuNode[], pathname: string): TabMenuNode | undefined => {
  const currentPath = normalizePath(pathname);

  for (const menu of menus) {
    if (
      normalizePath(menu.path) === currentPath ||
      (menu.type === 'link' && menu.openMode === 'iframe' && normalizePath(toIframeLinkPath(menu)) === currentPath)
    ) {
      return menu;
    }

    const child = findMenuByPath(menu.children ?? [], pathname);
    if (child) {
      return child;
    }
  }

  return undefined;
};

export const findRouteByPath = (pathname: string): FrontendRoute | undefined => {
  const currentPath = normalizePath(pathname);

  return frontendRoutes.find((route) =>
    matchPath({ path: normalizePath(route.path), end: true }, currentPath),
  );
};

export const createDescriptorMap = (
  menus: TabMenuNode[],
  t: (key?: string, fallback?: string) => string,
) => {
  const descriptors = new Map<string, TabDescriptor>();

  const visitMenu = (nodes: TabMenuNode[]) => {
    for (const menu of nodes) {
      if (menu.type === 'link' && menu.openMode === 'iframe') {
        const path = normalizePath(toIframeLinkPath(menu));
        descriptors.set(getTabKey(path), {
          key: getTabKey(path),
          path,
          title: menu.label,
          icon: menu.icon,
        });
      }

      if (menu.path && findRouteByPath(menu.path)) {
        descriptors.set(getTabKey(menu.path), {
          key: getTabKey(menu.path),
          path: normalizePath(menu.path),
          title: menu.label,
          icon: menu.icon,
        });
      }

      visitMenu(menu.children ?? []);
    }
  };

  visitMenu(menus);

  for (const route of frontendRoutes) {
    const tab = route.meta?.tab;
    if (!tab?.enabled || route.meta?.layout?.fullscreen) {
      continue;
    }

    const path = normalizePath(route.path);
    const key = tab.key ?? getTabKey(path);
    descriptors.set(key, {
      key,
      path,
      title: t(tab.title ?? route.meta?.title, path),
      icon:
        tab.icon || route.meta?.icon ? (
          <IconRenderer name={tab.icon || route.meta?.icon} />
        ) : undefined,
    });
  }

  return descriptors;
};

export const createHomeDescriptor = (
  menus: TabMenuNode[],
  descriptors: Map<string, TabDescriptor>,
  t: (key?: string, fallback?: string) => string,
): TabDescriptor | undefined => {
  const firstMenu = findFirstNavigableMenu(menus);
  const homePath = normalizePath(
    appHomeConfig.homePath ?? appHomeConfig.defaultHome ?? firstMenu?.path ?? '/',
  );
  const key = getTabKey(homePath);
  const descriptor = descriptors.get(key) ?? {
    key,
    path: homePath,
    title: appHomeConfig.homeTitle ? t(undefined, appHomeConfig.homeTitle) : t(undefined, '首页'),
  };

  return {
    ...descriptor,
    home: true,
    pinned: true,
  };
};

export const createRouteDescriptor = (
  menus: TabMenuNode[],
  pathname: string,
  t: (key?: string, fallback?: string) => string,
): TabDescriptor | undefined => {
  const route = findRouteByPath(pathname);
  if (route?.meta?.layout?.fullscreen) {
    return undefined;
  }

  const menu = findMenuByPath(menus, pathname);
  if (menu && route) {
    return {
      key: getTabKey(pathname),
      path: normalizePath(pathname),
      title: menu.label,
      icon: menu.icon,
    };
  }

  if (!route?.meta?.tab?.enabled) {
    return undefined;
  }

  const key = route.meta.tab.key ?? getTabKey(pathname);

  return {
    key,
    path: normalizePath(pathname),
    title: t(route.meta.tab.title ?? route.meta.title, pathname),
    icon:
      route.meta.tab.icon || route.meta.icon ? (
        <IconRenderer name={route.meta.tab.icon || route.meta.icon} />
      ) : undefined,
  };
};
