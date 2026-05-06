/**
 * @name 简单版路由配置
 * @description 此配置用于 npm run simple 命令执行后使用
 */
export default [
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
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: '@/modules/dashboard/pages/Dashboard',
  },
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
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '@/foundation/exception/pages/NotFound',
    path: '*',
  },
];
