import { moduleRoutes } from '../src/foundation/router/moduleRoutes.generated';

export default [
  ...moduleRoutes,
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '@/foundation/exception/pages/NotFound',
    path: '*',
  },
];
