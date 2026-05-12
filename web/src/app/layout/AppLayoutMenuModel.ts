import type { TrueAdminIconInput } from '@/core/icon/TrueAdminIcon';
import type { AppMenu as AppMenuConfig } from '@/core/menu/types';

export type RuntimeMenuNode = {
  key: string;
  path: string;
  id?: number;
  code: string;
  type?: AppMenuConfig['type'];
  url?: string;
  openMode?: AppMenuConfig['openMode'];
  showLinkHeader?: boolean;
  label: string;
  icon?: TrueAdminIconInput;
  children?: RuntimeMenuNode[];
};

export type MenuMatch = {
  selectedKey: string;
  openKeys: string[];
  breadcrumb: string[];
};

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const toRuntimeMenus = (
  menus: AppMenuConfig[] | undefined,
  t: (key?: string, fallback?: string) => string,
): RuntimeMenuNode[] =>
  (menus ?? [])
    .filter((menu) => menu.type !== 'button' && menu.status !== 'disabled')
    .map((menu) => ({
      key: String(menu.id ?? (menu.path || menu.code)),
      id: menu.id,
      code: menu.code,
      type: menu.type,
      path: menu.path,
      url: menu.url,
      openMode: menu.openMode,
      showLinkHeader: menu.showLinkHeader,
      label: t(menu.i18n, menu.title),
      icon: menu.icon || menu.code,
      children: toRuntimeMenus(menu.children, t),
    }));

export const toIframeLinkPath = (menu: RuntimeMenuNode): string =>
  `/link-frame/${encodeURIComponent(String(menu.id ?? menu.code))}`;

export const findMenuMatch = (
  menus: RuntimeMenuNode[],
  pathname: string,
  parents: string[] = [],
  labels: string[] = [],
): MenuMatch | null => {
  const currentPath = normalizePath(pathname);

  for (const menu of menus) {
    const nextLabels = [...labels, menu.label];
    if (
      (menu.path && normalizePath(menu.path) === currentPath) ||
      (menu.type === 'link' &&
        menu.openMode === 'iframe' &&
        normalizePath(toIframeLinkPath(menu)) === currentPath)
    ) {
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

export const resolveActiveRoot = (menus: RuntimeMenuNode[], menuMatch: MenuMatch | null) => {
  const rootKeys = menus.map((menu) => menu.key);
  const matchedRootKey = menuMatch?.openKeys[0] ?? menuMatch?.selectedKey;

  if (matchedRootKey && rootKeys.includes(matchedRootKey)) {
    return findMenuByKey(menus, matchedRootKey) ?? menus[0];
  }

  return menus[0];
};

export const getSideOpenKeys = (menuMatch: MenuMatch | null, activeRootKey?: string) =>
  (menuMatch?.openKeys ?? []).filter((key) => key !== activeRootKey);
