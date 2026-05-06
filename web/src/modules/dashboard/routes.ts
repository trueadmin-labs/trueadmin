import type { TrueAdminRoute } from '@/foundation/router/types';

const routes: TrueAdminRoute[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: '@/modules/dashboard/pages/Dashboard',
  },
];

export default routes;
