import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { TrueAdminRoute } from '../src/core/router/types';

function loadModuleRoutes(): TrueAdminRoute[] {
  const modulesRoot = join(__dirname, '..', 'src', 'modules');
  if (!existsSync(modulesRoot)) return [];

  return readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .flatMap((moduleName) => {
      const routeFile = join(modulesRoot, moduleName, 'routes.ts');
      if (!existsSync(routeFile)) return [];

      const routeModule = require(routeFile) as {
        default?: TrueAdminRoute[];
        routes?: TrueAdminRoute[];
      };

      return routeModule.default ?? routeModule.routes ?? [];
    });
}

export default [
  ...loadModuleRoutes(),
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '@/core/exception/NotFound',
    path: '*',
  },
];
