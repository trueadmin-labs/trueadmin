import type { Plugin } from 'vite';

const success = (data: unknown) => ({ code: 'SUCCESS', message: 'success', data });

const fail = (code: string, message: string, data?: unknown) => ({ code, message, data });

const users = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    status: 'enabled',
    primaryDeptId: null,
    deptIds: [],
    roles: ['super-admin'],
    roleIds: [1],
    createdAt: '2026-05-06 10:00:00',
    updatedAt: '2026-05-06 10:00:00',
  },
];

const departmentTree = [
  {
    id: 1,
    name: '总部',
    code: 'HQ',
    children: [
      { id: 11, name: '产品研发部', code: 'RD' },
      { id: 12, name: '运营中心', code: 'OPS' },
      { id: 13, name: '财务部', code: 'FIN' },
    ],
  },
  {
    id: 2,
    name: '华东分公司',
    code: 'EAST',
    children: [
      { id: 21, name: '杭州办事处', code: 'HZ' },
      { id: 22, name: '上海办事处', code: 'SH' },
    ],
  },
];

const menuTree = [
  {
    code: 'system.messages',
    title: '消息中心',
    i18n: 'menu.system.messages',
    path: '/messages',
    icon: 'MailOutlined',
    type: 'menu',
    status: 'enabled',
  },
  {
    code: 'organization',
    title: '组织权限',
    i18n: 'menu.organization',
    path: '/organization',
    icon: 'ApartmentOutlined',
    type: 'directory',
    status: 'enabled',
    children: [
      {
        code: 'system.departments',
        title: '部门管理',
        i18n: 'menu.system.departments',
        path: '/organization/departments',
        icon: 'TeamOutlined',
        type: 'menu',
        status: 'enabled',
      },
      {
        code: 'system.users',
        title: '管理员用户',
        i18n: 'menu.system.users',
        path: '/organization/users',
        icon: 'UserOutlined',
        type: 'menu',
        status: 'enabled',
      },
      {
        code: 'system.roles',
        title: '角色管理',
        i18n: 'menu.system.roles',
        path: '/organization/roles',
        icon: 'LockOutlined',
        type: 'menu',
        status: 'enabled',
      },
    ],
  },
  {
    code: 'messageManagement',
    title: '消息管理',
    i18n: 'menu.messageManagement',
    path: '/message-management',
    icon: 'NotificationOutlined',
    type: 'directory',
    status: 'enabled',
    children: [
      {
        code: 'system.announcementManagement',
        title: '公告管理',
        i18n: 'menu.system.announcementManagement',
        path: '/message-management/announcements',
        icon: 'NotificationOutlined',
        type: 'menu',
        status: 'enabled',
      },
      {
        code: 'system.notificationManagement',
        title: '通知管理',
        i18n: 'menu.system.notificationManagement',
        path: '/message-management/notifications',
        icon: 'BellOutlined',
        type: 'menu',
        status: 'enabled',
      },
    ],
  },
  {
    code: 'systemConfig',
    title: '系统配置',
    i18n: 'menu.systemConfig',
    path: '/system-config',
    icon: 'SettingOutlined',
    type: 'directory',
    status: 'enabled',
    children: [
      {
        code: 'system.menus',
        title: '菜单管理',
        i18n: 'menu.system.menus',
        path: '/system-config/menus',
        icon: 'MenuOutlined',
        type: 'menu',
        status: 'enabled',
      },
    ],
  },
];

const sendJson = (
  res: { setHeader: (key: string, value: string) => void; end: (data: string) => void },
  data: unknown,
) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
};

export const trueAdminMockPlugin = (enabled: boolean): Plugin => ({
  name: 'trueadmin:test-mock',
  configureServer(server) {
    if (!enabled) {
      return;
    }

    server.middlewares.use('/api/admin/auth/login', (_req, res) => {
      sendJson(res, success({ tokenType: 'Bearer', accessToken: 'mock-token', expiresIn: 7200 }));
    });

    server.middlewares.use('/api/admin/auth/logout', (_req, res) => {
      sendJson(res, success(null));
    });

    server.middlewares.use('/api/admin/auth/me', (_req, res) => {
      sendJson(
        res,
        success({
          id: 1,
          username: 'admin',
          nickname: '超级管理员',
          roles: ['super-admin'],
          permissions: ['*'],
          primaryDeptId: null,
          deptIds: [],
          operationDeptId: null,
        }),
      );
    });

    server.middlewares.use('/api/admin/system-config/menu-tree', (_req, res) => {
      sendJson(res, success(menuTree));
    });

    server.middlewares.use('/api/admin/organization/departments/tree', (_req, res) => {
      sendJson(res, success(departmentTree));
    });

    server.middlewares.use('/api/admin/organization/users', (req, res) => {
      if (req.method === 'DELETE') {
        sendJson(
          res,
          fail('SYSTEM.USER.NOT_FOUND', '管理员用户不存在或已被删除', {
            reason: 'record_missing',
            traceId: 'mock-trace-user-delete',
          }),
        );
        return;
      }

      sendJson(res, success({ items: users, total: users.length, page: 1, pageSize: 20 }));
    });
  },
});
