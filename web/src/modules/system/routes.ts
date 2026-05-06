import type { TrueAdminRoute } from '@/foundation/router/types';

const routes: TrueAdminRoute[] = [
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    routes: [
      {
        path: '/system',
        redirect: '/system/users',
      },
      {
        path: '/system/users',
        name: 'system.users',
        component: '@/modules/system/pages/Users',
      },
      {
        path: '/system/roles',
        name: 'system.roles',
        component: '@/modules/system/pages/Roles',
      },
      {
        path: '/system/departments',
        name: 'system.departments',
        component: '@/modules/system/pages/Departments',
      },
      {
        path: '/system/client-users',
        name: 'system.client-users',
        component: '@/modules/system/pages/ClientUsers',
      },
      {
        path: '/system/menus',
        name: 'system.menus',
        component: '@/modules/system/pages/Menus',
      },
    ],
  },
];

export default routes;
