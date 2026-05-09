import { env } from '@config/index';
import { frontendMenus } from '@/core/module/registry';
import type { FrontendMenu } from '@/core/module/types';
import type { AppMenu, BackendMenu } from './types';

const isFrontendMenuEnabled = (menu: FrontendMenu): boolean =>
  !menu.devOnly || env.isDev || env.isTest;

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const sortMenus = <T extends { sort?: number }>(menus: T[]): T[] =>
  [...menus].sort((left, right) => (left.sort ?? 0) - (right.sort ?? 0));

const toAppMenu = (menu: FrontendMenu): AppMenu => {
  const { parentPath: _parentPath, devOnly: _devOnly, children, ...rest } = menu;

  return {
    ...rest,
    children: children?.filter(isFrontendMenuEnabled).map(toAppMenu),
  };
};

const appendToParent = (menus: AppMenu[], parentPath: string, child: AppMenu): boolean => {
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

export const mergeFrontendMenus = (backendMenus: BackendMenu[] | undefined): AppMenu[] => {
  const mergedMenus: AppMenu[] = structuredClone(backendMenus ?? []);

  for (const menu of frontendMenus.filter(isFrontendMenuEnabled)) {
    const nextMenu = toAppMenu(menu);
    if (menu.parentPath && appendToParent(mergedMenus, menu.parentPath, nextMenu)) {
      continue;
    }

    mergedMenus.push(nextMenu);
  }

  return sortMenus(mergedMenus);
};
