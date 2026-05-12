import { lazy } from 'react';
import { defineModule } from '@/core/module/types';

export default defineModule({
  id: 'workbench',
  routes: [
    {
      path: '/workbench',
      component: lazy(() => import('./pages/WorkbenchPage')),
      meta: {
        title: 'workbench.title',
        icon: 'DashboardOutlined',
        auth: true,
      },
    },
  ],
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
});
