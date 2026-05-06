import { matchPath } from 'react-router';
import { frontendRoutes } from '@/core/module/registry';
import type { RouteLayoutMeta } from '@/core/module/types';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export const getRouteLayoutMeta = (pathname: string): RouteLayoutMeta => {
  const currentPath = normalizePath(pathname);
  const route = frontendRoutes.find((item) =>
    matchPath({ path: normalizePath(item.path), end: true }, currentPath),
  );

  return route?.meta?.layout ?? {};
};
