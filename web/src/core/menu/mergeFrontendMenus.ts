import { env } from '@config/index';
import { frontendMenus } from '@/core/module/registry';
import type { FrontendMenu } from '@/core/module/types';
import type { BackendMenu } from './types';

const isFrontendMenuEnabled = (menu: FrontendMenu): boolean =>
  !menu.devOnly || env.isDev || env.isTest;

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const sortMenus = <T extends { sort?: number }>(menus: T[]): T[] =>
  [...menus].sort(
    (left, right) =>
      (left.sort ?? Number.MAX_SAFE_INTEGER) - (right.sort ?? Number.MAX_SAFE_INTEGER),
  );

const toBackendMenu = (menu: FrontendMenu): BackendMenu => {
  const { parentPath: _parentPath, devOnly: _devOnly, children, ...rest } = menu;

  return {
    ...rest,
    children: children?.filter(isFrontendMenuEnabled).map(toBackendMenu),
  };
};

const appendToParent = (menus: BackendMenu[], parentPath: string, child: BackendMenu): boolean => {
  for (const menu of menus) {
    if (normalizePath(menu.path) === normalizePath(parentPath)) {
      menu.children = sortMenus([...(menu.children ?? []), child]);
      return true;
    }

    if (menu.children && appendToParent(menu.children, parentPath, child)) {
      return true;
    }
  }

  return false;
};

export const mergeFrontendMenus = (backendMenus: BackendMenu[] | undefined): BackendMenu[] => {
  const mergedMenus = structuredClone(backendMenus ?? []);

  for (const menu of frontendMenus.filter(isFrontendMenuEnabled)) {
    const nextMenu = toBackendMenu(menu);
    if (menu.parentPath && appendToParent(mergedMenus, menu.parentPath, nextMenu)) {
      continue;
    }

    mergedMenus.push(nextMenu);
  }

  return sortMenus(mergedMenus);
};
