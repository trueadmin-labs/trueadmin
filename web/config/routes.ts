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
        component: './user/login',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './Dashboard',
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
        component: './system/users',
      },
      {
        path: '/system/roles',
        name: 'system.roles',
        component: './system/roles',
      },
      {
        path: '/system/menus',
        name: 'system.menus',
        component: './system/menus',
      },
    ],
  },
  {
    path: '/products',
    name: 'products',
    icon: 'appstore',
    component: './products',
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];
