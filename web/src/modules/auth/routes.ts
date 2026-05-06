import type { TrueAdminRoute } from '@/foundation/router/types';

const routes: TrueAdminRoute[] = [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: '@/modules/auth/pages/Login',
      },
    ],
  },
];

export default routes;
