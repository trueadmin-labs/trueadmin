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
        pageType: 'dashboard-page',
        icon: 'dashboard',
        auth: true,
      },
    },
  ],
  menus: [
    {
      code: 'workbench',
      title: 'Workbench',
      i18n: 'menu.workbench',
      path: '/workbench',
      icon: 'dashboard',
      type: 'menu',
      status: 'enabled',
      sort: -100,
    },
  ],
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
});
