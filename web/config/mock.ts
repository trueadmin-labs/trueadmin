import type { Plugin } from 'vite';

const success = (data: unknown) => ({ code: 'KERNEL.SUCCESS', message: 'success', data });

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

const menuTree = [
  {
    code: 'system',
    title: '系统管理',
    i18n: 'menu.system',
    path: '/system',
    icon: 'setting',
    type: 'directory',
    status: 'enabled',
    children: [
      {
        code: 'system.users',
        title: '用户管理',
        i18n: 'menu.system.users',
        path: '/system/users',
        icon: 'user',
        type: 'menu',
        status: 'enabled',
      },
      {
        code: 'system.departments',
        title: '部门管理',
        path: '/system/departments',
        icon: 'team',
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

    server.middlewares.use('/api/admin/system/menu-tree', (_req, res) => {
      sendJson(res, success(menuTree));
    });

    server.middlewares.use('/api/admin/system/users', (req, res) => {
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
