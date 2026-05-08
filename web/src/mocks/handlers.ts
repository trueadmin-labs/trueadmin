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

const now = '2026-05-09 10:30:00';

const messageItems = [
  {
    id: 1,
    kind: 'announcement',
    title: '系统维护公告',
    content:
      '## 系统维护公告\n\n本周五 22:00 将进行后台服务维护，预计影响 30 分钟。\n\n- 维护期间仍可查看历史数据\n- 新增、编辑、导入任务会暂时暂停',
    level: 'warning',
    type: 'announcement',
    source: 'system',
    targetUrl: '/workbench',
    payload: { maintenanceWindow: '2026-05-10 22:00' },
    attachments: [],
    readAt: null,
    archivedAt: null,
    pinned: true,
    createdAt: now,
  },
  {
    id: 2,
    kind: 'notification',
    title: '配置项等待确认',
    content: '配置项 **系统参数 01** 已提交变更，请进入 CRUD 示例页面查看处理。',
    level: 'info',
    type: 'system',
    source: 'plugin.true-admin.examples',
    targetUrl: '/examples/crud',
    payload: { recordId: 1 },
    attachments: [],
    readAt: null,
    archivedAt: null,
    pinned: false,
    createdAt: '2026-05-09 09:45:00',
  },
  {
    id: 3,
    kind: 'notification',
    title: '导入任务完成',
    content: '示例导入任务已完成，成功 128 条，失败 0 条。',
    level: 'success',
    type: 'system',
    source: 'system',
    attachments: [],
    readAt: '2026-05-09 09:20:00',
    archivedAt: null,
    pinned: false,
    createdAt: '2026-05-09 09:18:00',
  },
];

const getMessageKey = (message: { id: number; kind: string }) => `${message.kind}:${message.id}`;

const readMessageKeys = new Set(
  messageItems.filter((message) => message.readAt).map((message) => getMessageKey(message)),
);

const archivedMessageKeys = new Set<string>();

const withMessageState = () =>
  messageItems.map((message) => {
    const key = getMessageKey(message);
    return {
      ...message,
      archivedAt: archivedMessageKeys.has(key) ? now : null,
      readAt: readMessageKeys.has(key) ? (message.readAt ?? now) : null,
    };
  });

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
  http.get('/api/admin/system/departments/tree', () => success(departmentTree)),
  http.get('/api/admin/system/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    return success({ items: users, total: users.length, page, pageSize });
  }),
  http.get('/api/admin/messages', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 5);
    const kind = url.searchParams.get('kind') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const level = url.searchParams.get('level') || '';
    const type = url.searchParams.get('type') || '';
    const source = url.searchParams.get('source') || '';
    const startAt = url.searchParams.get('startAt') || '';
    const endAt = url.searchParams.get('endAt') || '';
    const items = withMessageState().filter((message) => {
      if (kind !== 'all' && message.kind !== kind) {
        return false;
      }
      if (status === 'unread') {
        return !message.readAt && !message.archivedAt;
      }
      if (status === 'read') {
        return Boolean(message.readAt) && !message.archivedAt;
      }
      if (status === 'archived') {
        return Boolean(message.archivedAt);
      }
      if (level && message.level !== level) {
        return false;
      }
      if (type && message.type !== type) {
        return false;
      }
      if (source && message.source !== source) {
        return false;
      }
      if (startAt && message.createdAt < startAt) {
        return false;
      }
      if (endAt && message.createdAt > endAt) {
        return false;
      }
      if (keyword) {
        const searchable = [message.title, message.content, message.source, message.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(keyword)) {
          return false;
        }
      }
      return status === 'archived' || !message.archivedAt;
    });
    const start = Math.max(0, (page - 1) * pageSize);

    return success({
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/messages/unread-count', () => {
    const unreadItems = withMessageState().filter(
      (message) => !message.readAt && !message.archivedAt,
    );
    return success({
      announcement: unreadItems.filter((message) => message.kind === 'announcement').length,
      notification: unreadItems.filter((message) => message.kind === 'notification').length,
      total: unreadItems.length,
    });
  }),
  http.get('/api/admin/messages/:kind/:id', ({ params }) => {
    const item = withMessageState().find(
      (message) => message.kind === params.kind && String(message.id) === String(params.id),
    );
    return item ? success(item) : fail('SYSTEM.MESSAGE.NOT_FOUND', '消息不存在');
  }),
  http.post('/api/admin/messages/read', async ({ request }) => {
    const body = (await request.json()) as { messages?: Array<{ id: number; kind: string }> };
    body.messages?.forEach((message) => {
      readMessageKeys.add(getMessageKey(message));
    });
    return success(null);
  }),
  http.post('/api/admin/messages/archive', async ({ request }) => {
    const body = (await request.json()) as { messages?: Array<{ id: number; kind: string }> };
    body.messages?.forEach((message) => {
      archivedMessageKeys.add(getMessageKey(message));
    });
    return success(null);
  }),
  http.post('/api/admin/messages/restore', async ({ request }) => {
    const body = (await request.json()) as { messages?: Array<{ id: number; kind: string }> };
    body.messages?.forEach((message) => {
      archivedMessageKeys.delete(getMessageKey(message));
    });
    return success(null);
  }),
  http.post('/api/admin/messages/read-all', async ({ request }) => {
    const body = (await request.json()) as { kind?: string };
    withMessageState().forEach((message) => {
      if (!body.kind || body.kind === 'all' || message.kind === body.kind) {
        readMessageKeys.add(getMessageKey(message));
      }
    });
    return success(null);
  }),
  http.delete('/api/admin/system/users/:id', () =>
    fail('SYSTEM.USER.NOT_FOUND', '管理员用户不存在或已被删除', {
      reason: 'record_missing',
      traceId: 'mock-trace-user-delete',
    }),
  ),
];
