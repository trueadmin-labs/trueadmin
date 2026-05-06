import { HttpResponse, http } from 'msw';

const success = <T>(data: T) =>
  HttpResponse.json({ code: 'KERNEL.SUCCESS', message: 'success', data });

const fail = (code: string, message: string, data?: unknown) =>
  HttpResponse.json({ code, message, data }, { status: 400 });

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

export const handlers = [
  http.post('/api/admin/auth/login', async () =>
    success({ tokenType: 'Bearer', accessToken: 'mock-token', expiresIn: 7200 }),
  ),
  http.post('/api/admin/auth/logout', () => success(null)),
  http.get('/api/admin/auth/me', () =>
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
  ),
  http.get('/api/admin/system/menu-tree', () =>
    success([
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
    ]),
  ),
  http.get('/api/admin/system/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    return success({ items: users, total: users.length, page, pageSize });
  }),
  http.delete('/api/admin/system/users/:id', () =>
    fail('SYSTEM.USER.NOT_FOUND', '管理员用户不存在或已被删除', {
      reason: 'record_missing',
      traceId: 'mock-trace-user-delete',
    }),
  ),
];
