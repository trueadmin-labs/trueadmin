import { lazy } from 'react';
import { defineModule } from '@/core/module/types';

export default defineModule({
  id: 'demo',
  routes: [
    {
      path: '/examples/permission',
      component: lazy(() => import('@/app/pages/PermissionExamplePage')),
      meta: { title: 'demo.permission.title', pageType: 'custom-page', auth: true },
    },
  ],
  menus: [
    {
      code: 'demo',
      title: 'Demo',
      i18n: 'menu.demo',
      path: '/examples',
      icon: 'app',
      type: 'directory',
      status: 'enabled',
      sort: 9000,
      devOnly: true,
      children: [
        {
          code: 'demo.permission',
          title: 'Permission Demo',
          i18n: 'menu.demo.permission',
          path: '/examples/permission',
          icon: 'lock',
          type: 'menu',
          status: 'enabled',
          sort: 10,
        },
      ],
    },
  ],
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
});
