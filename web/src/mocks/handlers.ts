import { HttpResponse, http } from 'msw';
import type {
  AdminAnnouncement,
  AdminAnnouncementStatus,
  AdminAnnouncementTargetType,
  AdminMessageLevel,
  AdminNotificationBatch,
  AdminNotificationDelivery,
} from '@/core/notification';
import type { TrueAdminAttachmentValue } from '@/core/upload';

const success = <T>(data: T) =>
  HttpResponse.json({ code: 'KERNEL.SUCCESS', message: 'success', data });

const fail = (code: string, message: string, data?: unknown) =>
  HttpResponse.json({ code, message, data }, { status: 400 });

const getCrudParam = (url: URL, field: string, fallback = '') =>
  url.searchParams.get(`params[${field}]`) ?? fallback;

const getCrudFilter = (url: URL, field: string, fallback = '') => {
  for (let index = 0; index < 20; index += 1) {
    if (url.searchParams.get(`filters[${index}][field]`) === field) {
      const arrayValue = url.searchParams.getAll(`filters[${index}][value][]`);
      if (arrayValue.length > 0) {
        return arrayValue.filter(Boolean).join(',');
      }

      return url.searchParams.get(`filters[${index}][value]`) ?? fallback;
    }
  }

  return fallback;
};

const users = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: '',
    preferences: {},
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

const roleOptions = [
  {
    id: 1,
    parentId: 0,
    code: 'super-admin',
    name: '超级管理员',
    level: 1,
    path: '',
    sort: 0,
    status: 'enabled',
  },
  {
    id: 2,
    parentId: 1,
    code: 'operator',
    name: '运营管理员',
    level: 2,
    path: ',1,',
    sort: 10,
    status: 'enabled',
  },
  {
    id: 3,
    parentId: 1,
    code: 'auditor',
    name: '审计员',
    level: 2,
    path: ',1,',
    sort: 20,
    status: 'enabled',
  },
];

const roleTree = [
  {
    ...roleOptions[0],
    children: [roleOptions[1], roleOptions[2]],
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
    source: 'true-admin.examples',
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

const notificationBatches: AdminNotificationBatch[] = [
  {
    id: 1002,
    title: '配置项等待确认',
    content: '配置项系统参数 01 已提交变更，请进入 CRUD 示例页面查看处理。',
    kind: 'notification',
    level: 'info',
    type: 'system',
    source: 'true-admin.examples',
    status: 'partial_failed',
    targetType: 'role',
    targetSummary: '运营管理员',
    targetRoleIds: [2],
    pinned: false,
    scheduledAt: null,
    publishedAt: '2026-05-09 09:45:00',
    expireAt: null,
    offlineAt: null,
    deliveryTotal: 2,
    sentTotal: 1,
    failedTotal: 1,
    readTotal: 0,
    attachments: [],
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 09:40:00',
    updatedAt: '2026-05-09 09:45:00',
  },
];

const announcements: AdminAnnouncement[] = [
  {
    id: 1001,
    title: '系统维护公告',
    content: '本周五 22:00 将进行后台服务维护，预计影响 30 分钟。',
    kind: 'announcement',
    level: 'warning',
    type: 'announcement',
    source: 'system',
    status: 'active',
    targetType: 'all',
    targetSummary: '全员',
    targetRoleIds: [],
    pinned: true,
    scheduledAt: null,
    publishedAt: '2026-05-09 10:30:00',
    expireAt: null,
    offlineAt: null,
    deliveryTotal: 3,
    sentTotal: 3,
    failedTotal: 0,
    readTotal: 1,
    attachments: [
      {
        id: 'maintenance-guide',
        name: '维护说明',
        url: '/mock/attachments/sales-contract.pdf',
        extension: 'pdf',
        size: 245760,
        mimeType: 'application/pdf',
      },
    ],
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 10:20:00',
    updatedAt: '2026-05-09 10:30:00',
  },
  {
    id: 1003,
    title: '端午节值班安排',
    content: '请各部门在本周内确认端午节值班人员。',
    kind: 'announcement',
    level: 'info',
    type: 'announcement',
    source: 'system',
    status: 'scheduled',
    targetType: 'role',
    targetSummary: '超级管理员、运营管理员',
    targetRoleIds: [1, 2],
    pinned: false,
    scheduledAt: '2026-05-10 09:00:00',
    publishedAt: null,
    expireAt: null,
    offlineAt: null,
    deliveryTotal: 0,
    sentTotal: 0,
    failedTotal: 0,
    readTotal: 0,
    attachments: [],
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 08:30:00',
    updatedAt: '2026-05-09 08:30:00',
  },
];

const notificationDeliveries: AdminNotificationDelivery[] = [
  {
    id: 5003,
    batchId: 1002,
    receiverId: 2,
    receiverName: '运营管理员',
    status: 'failed',
    readAt: null,
    archivedAt: null,
    sentAt: null,
    failedReason: '接收人账号已停用',
    retryCount: 1,
    createdAt: '2026-05-09 09:45:01',
    updatedAt: '2026-05-09 09:46:00',
  },
  {
    id: 5004,
    batchId: 1002,
    receiverId: 1,
    receiverName: '超级管理员',
    status: 'sent',
    readAt: null,
    archivedAt: null,
    sentAt: '2026-05-09 09:45:01',
    failedReason: null,
    retryCount: 0,
    createdAt: '2026-05-09 09:45:01',
    updatedAt: '2026-05-09 09:45:01',
  },
];

const loginLogs = [
  {
    id: 1,
    adminUserId: 1,
    username: 'admin',
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Mock Browser',
    status: 'success',
    reason: '',
    createdAt: '2026-05-09 10:30:00',
    updatedAt: '2026-05-09 10:30:00',
  },
  {
    id: 2,
    adminUserId: null,
    username: 'demo',
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Mock Browser',
    status: 'failed',
    reason: 'password_not_match',
    createdAt: '2026-05-09 10:20:00',
    updatedAt: '2026-05-09 10:20:00',
  },
];

const operationLogs = [
  {
    id: 1,
    module: 'system',
    action: 'admin.profile.update',
    remark: '更新个人资料',
    principalType: 'admin_user',
    principalId: '1',
    operatorType: 'admin',
    operatorId: '1',
    operationDeptId: null,
    context: { nickname: '超级管理员' },
    createdAt: '2026-05-09 10:35:00',
    updatedAt: '2026-05-09 10:35:00',
  },
];

const getNotificationTargetSummary = (body: {
  targetType?: AdminAnnouncementTargetType;
  targetRoleIds?: number[];
}) => {
  if (body.targetType !== 'role' || !body.targetRoleIds?.length) {
    return '全员';
  }

  const roleNameMap = new Map([
    [1, '超级管理员'],
    [2, '运营管理员'],
    [3, '审计员'],
  ]);

  return body.targetRoleIds.map((id) => roleNameMap.get(id) ?? String(id)).join('、');
};

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
      avatar: '',
      preferences: users[0].preferences,
      roles: ['super-admin'],
      permissions: ['*'],
      primaryDeptId: null,
      deptIds: [],
      operationDeptId: null,
    }),
  ),
  http.get('/api/admin/system-config/menu-tree', () =>
    success([
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
            title: '成员管理',
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
          {
            code: 'system.loginLogs',
            title: '登录日志',
            i18n: 'menu.system.loginLogs',
            path: '/system-config/login-logs',
            icon: 'LoginOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'system.operationLogs',
            title: '操作日志',
            i18n: 'menu.system.operationLogs',
            path: '/system-config/operation-logs',
            icon: 'AuditOutlined',
            type: 'menu',
            status: 'enabled',
          },
        ],
      },
    ]),
  ),
  http.get('/api/admin/profile', () => success(users[0])),
  http.put('/api/admin/profile', async ({ request }) => {
    const body = (await request.json()) as { nickname?: string; avatar?: string };
    Object.assign(users[0], {
      nickname: body.nickname || users[0].nickname,
      avatar: body.avatar ?? users[0].avatar,
      updatedAt: now,
    });
    return success(users[0]);
  }),
  http.put('/api/admin/profile/password', () => success(null)),
  http.put('/api/admin/profile/preferences', async ({ request }) => {
    const body = (await request.json()) as {
      namespace?: string;
      values?: Record<string, unknown>;
    };
    if (!body.namespace || !body.values) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '参数错误');
    }

    Object.assign(users[0], {
      preferences: {
        ...users[0].preferences,
        [body.namespace]: body.values,
      },
      updatedAt: now,
    });
    return success(users[0]);
  }),
  http.get('/api/admin/system-config/login-logs', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const start = Math.max(0, (page - 1) * pageSize);
    return success({
      items: loginLogs.slice(start, start + pageSize),
      total: loginLogs.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/system-config/login-logs/:id', ({ params }) => {
    const id = Number(params.id);
    const log = loginLogs.find((item) => item.id === id);
    if (!log) {
      return fail('KERNEL.NOT_FOUND', '登录日志不存在');
    }

    return success(log);
  }),
  http.get('/api/admin/system-config/operation-logs', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const start = Math.max(0, (page - 1) * pageSize);
    return success({
      items: operationLogs.slice(start, start + pageSize),
      total: operationLogs.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/system-config/operation-logs/:id', ({ params }) => {
    const id = Number(params.id);
    const log = operationLogs.find((item) => item.id === id);
    if (!log) {
      return fail('KERNEL.NOT_FOUND', '操作日志不存在');
    }

    return success(log);
  }),
  http.get('/api/admin/organization/departments/tree', () => success(departmentTree)),
  http.get('/api/admin/organization/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    return success({ items: users, total: users.length, page, pageSize });
  }),
  http.get('/api/admin/organization/roles/tree', () => success(roleTree)),
  http.get('/api/admin/organization/roles/options', () => success(roleOptions)),
  http.get('/api/admin/messages', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 5);
    const kind = getCrudParam(url, 'kind', 'all');
    const status = getCrudParam(url, 'status', 'all');
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const level = getCrudFilter(url, 'level');
    const type = getCrudFilter(url, 'type');
    const source = getCrudFilter(url, 'source');
    const [startAt, endAt] = getCrudFilter(url, 'createdAt').split(',');
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
  http.get('/api/admin/message-management/notifications', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = getCrudFilter(url, 'status');
    const level = getCrudFilter(url, 'level') || getCrudParam(url, 'level');
    const type = getCrudFilter(url, 'type') || getCrudParam(url, 'type');
    const source = getCrudFilter(url, 'source') || getCrudParam(url, 'source');
    const items = notificationBatches.filter((batch) => {
      if (status && batch.status !== status) {
        return false;
      }
      if (level && batch.level !== level) {
        return false;
      }
      if (type && batch.type !== type) {
        return false;
      }
      if (source && batch.source !== source) {
        return false;
      }
      if (keyword) {
        const searchable = [
          batch.title,
          batch.content,
          batch.source,
          batch.type,
          batch.operatorName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
    const start = Math.max(0, (page - 1) * pageSize);
    const statusStats = notificationBatches.reduce<Record<string, number>>((stats, batch) => {
      stats[batch.status] = (stats[batch.status] ?? 0) + 1;
      return stats;
    }, {});
    return success({
      items: items.slice(start, start + pageSize),
      meta: { statusStats },
      total: items.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/message-management/notifications/:id', ({ params }) => {
    const batch = notificationBatches.find((item) => String(item.id) === String(params.id));
    if (!batch) {
      return fail('KERNEL.NOT_FOUND', '通知不存在');
    }

    return success(batch);
  }),
  http.get('/api/admin/message-management/notifications/:id/deliveries', ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const status = getCrudFilter(url, 'status') || getCrudParam(url, 'status');
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const items = notificationDeliveries.filter((delivery) => {
      if (String(delivery.batchId) !== String(params.id)) {
        return false;
      }
      if (status && delivery.status !== status) {
        return false;
      }
      if (keyword && !delivery.receiverName.toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
    const start = Math.max(0, (page - 1) * pageSize);
    return success({
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    });
  }),
  http.post('/api/admin/message-management/notifications/:id/resend', ({ params }) => {
    let resent = 0;
    notificationDeliveries.forEach((delivery) => {
      if (String(delivery.batchId) === String(params.id) && delivery.status === 'failed') {
        delivery.status = 'sent';
        delivery.sentAt = now;
        delivery.failedReason = null;
        delivery.retryCount += 1;
        delivery.updatedAt = now;
        resent += 1;
      }
    });
    const batch = notificationBatches.find((item) => String(item.id) === String(params.id));
    if (batch) {
      batch.failedTotal = Math.max(0, batch.failedTotal - resent);
      batch.sentTotal += resent;
      batch.status = batch.failedTotal > 0 ? 'partial_failed' : 'completed';
      batch.updatedAt = now;
    }
    return success({ resent });
  }),
  http.get('/api/admin/message-management/announcements', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = getCrudFilter(url, 'status');
    const level = getCrudFilter(url, 'level') || getCrudParam(url, 'level');
    const type = getCrudFilter(url, 'type') || getCrudParam(url, 'type');
    const source = getCrudFilter(url, 'source') || getCrudParam(url, 'source');
    const items = announcements.filter((announcement) => {
      if (status && announcement.status !== status) {
        return false;
      }
      if (level && announcement.level !== level) {
        return false;
      }
      if (type && announcement.type !== type) {
        return false;
      }
      if (source && announcement.source !== source) {
        return false;
      }
      if (keyword) {
        const searchable = [
          announcement.title,
          announcement.content,
          announcement.source,
          announcement.type,
          announcement.operatorName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
    const start = Math.max(0, (page - 1) * pageSize);
    const statusStats = announcements.reduce<Record<string, number>>((stats, announcement) => {
      stats[announcement.status] = (stats[announcement.status] ?? 0) + 1;
      return stats;
    }, {});
    return success({
      items: items.slice(start, start + pageSize),
      meta: { statusStats },
      total: items.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/message-management/announcements/:id', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('KERNEL.NOT_FOUND', '公告不存在');
    }

    return success(announcement);
  }),
  http.post('/api/admin/message-management/announcements', async ({ request }) => {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      level?: AdminMessageLevel;
      type?: string;
      targetType?: AdminAnnouncementTargetType;
      targetRoleIds?: number[];
      pinned?: boolean;
      scheduledAt?: string | null;
      expireAt?: string | null;
      attachments?: TrueAdminAttachmentValue[];
    };
    const nextId = Math.max(...announcements.map((announcement) => announcement.id)) + 1;
    const isScheduled = Boolean(body.scheduledAt);
    const announcement: AdminAnnouncement = {
      id: nextId,
      title: body.title || '未命名公告',
      content: body.content || '',
      kind: 'announcement',
      level: body.level || 'info',
      type: body.type || 'announcement',
      source: 'system',
      status: (isScheduled ? 'scheduled' : 'active') satisfies AdminAnnouncementStatus,
      targetType: body.targetType || 'all',
      targetSummary: getNotificationTargetSummary(body),
      targetRoleIds: body.targetType === 'role' ? (body.targetRoleIds ?? []) : [],
      pinned: Boolean(body.pinned),
      scheduledAt: body.scheduledAt ?? null,
      publishedAt: isScheduled ? null : now,
      expireAt: body.expireAt ?? null,
      offlineAt: null,
      deliveryTotal: isScheduled ? 0 : 1,
      sentTotal: isScheduled ? 0 : 1,
      failedTotal: 0,
      readTotal: 0,
      attachments: body.attachments ?? [],
      operatorId: 1,
      operatorName: '超级管理员',
      createdAt: now,
      updatedAt: now,
    };
    announcements.unshift(announcement);
    return success(announcement);
  }),
  http.put('/api/admin/message-management/announcements/:id', async ({ params, request }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    if (announcement.status !== 'draft' && announcement.status !== 'scheduled') {
      return fail('SYSTEM.ANNOUNCEMENT.CANNOT_UPDATE', '只有草稿或定时发布的公告可以编辑');
    }
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      level?: AdminMessageLevel;
      type?: string;
      targetType?: AdminAnnouncementTargetType;
      targetRoleIds?: number[];
      pinned?: boolean;
      scheduledAt?: string | null;
      expireAt?: string | null;
      attachments?: TrueAdminAttachmentValue[];
    };
    const isScheduled = Boolean(body.scheduledAt);
    announcement.title = body.title || announcement.title;
    announcement.content = body.content || '';
    announcement.level = body.level || announcement.level;
    announcement.type = body.type || announcement.type;
    announcement.targetType = body.targetType || 'all';
    announcement.targetRoleIds =
      announcement.targetType === 'role' ? (body.targetRoleIds ?? []) : [];
    announcement.targetSummary = getNotificationTargetSummary({
      targetType: announcement.targetType,
      targetRoleIds: announcement.targetRoleIds,
    });
    announcement.pinned = Boolean(body.pinned);
    announcement.attachments = body.attachments ?? [];
    announcement.status = isScheduled ? 'scheduled' : 'draft';
    announcement.scheduledAt = body.scheduledAt ?? null;
    announcement.publishedAt = null;
    announcement.expireAt = body.expireAt ?? null;
    announcement.offlineAt = null;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.delete('/api/admin/message-management/announcements/:id', ({ params }) => {
    const index = announcements.findIndex((item) => String(item.id) === String(params.id));
    if (index < 0) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    if (announcements[index]?.status !== 'draft') {
      return fail('SYSTEM.ANNOUNCEMENT.CANNOT_DELETE', '只有草稿公告可以删除');
    }
    announcements.splice(index, 1);
    return success(null);
  }),
  http.post('/api/admin/message-management/announcements/:id/publish', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    announcement.status = 'active';
    announcement.publishedAt = now;
    announcement.scheduledAt = null;
    announcement.offlineAt = null;
    announcement.updatedAt = now;
    if (announcement.deliveryTotal === 0) {
      announcement.deliveryTotal = 1;
      announcement.sentTotal = 1;
    }
    return success(announcement);
  }),
  http.post('/api/admin/message-management/announcements/:id/offline', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    announcement.status = 'offline';
    announcement.offlineAt = now;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.post('/api/admin/message-management/announcements/:id/restore', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    announcement.status = 'active';
    announcement.publishedAt = announcement.publishedAt ?? now;
    announcement.scheduledAt = null;
    announcement.offlineAt = null;
    announcement.expireAt =
      announcement.expireAt && new Date(announcement.expireAt).getTime() <= Date.now()
        ? null
        : announcement.expireAt;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.post('/api/admin/message-management/announcements/:id/cancel-scheduled', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    if (announcement.status !== 'scheduled') {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_SCHEDULED', '只有定时发布的公告可以取消');
    }
    announcement.status = 'draft';
    announcement.scheduledAt = null;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.delete('/api/admin/organization/users/:id', () =>
    fail('SYSTEM.USER.NOT_FOUND', '成员不存在或已被删除', {
      reason: 'record_missing',
      traceId: 'mock-trace-user-delete',
    }),
  ),
];
