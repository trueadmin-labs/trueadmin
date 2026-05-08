import { HttpResponse, http } from 'msw';
import type {
  AdminMessageLevel,
  AdminNotificationBatch,
  AdminNotificationBatchStatus,
  AdminNotificationDelivery,
  AdminNotificationTargetType,
} from '@/core/notification';

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

const notificationBatches: AdminNotificationBatch[] = [
  {
    id: 1001,
    title: '系统维护公告',
    content: '本周五 22:00 将进行后台服务维护，预计影响 30 分钟。',
    kind: 'announcement',
    level: 'warning',
    type: 'announcement',
    source: 'system',
    status: 'published',
    targetType: 'all',
    targetSummary: '全员',
    pinned: true,
    scheduledAt: null,
    publishedAt: '2026-05-09 10:30:00',
    offlineAt: null,
    deliveryTotal: 3,
    sentTotal: 3,
    failedTotal: 0,
    readTotal: 1,
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 10:20:00',
    updatedAt: '2026-05-09 10:30:00',
  },
  {
    id: 1002,
    title: '配置项等待确认',
    content: '配置项系统参数 01 已提交变更，请进入 CRUD 示例页面查看处理。',
    kind: 'notification',
    level: 'info',
    type: 'system',
    source: 'plugin.true-admin.examples',
    status: 'published',
    targetType: 'role',
    targetSummary: '运营管理员',
    pinned: false,
    scheduledAt: null,
    publishedAt: '2026-05-09 09:45:00',
    offlineAt: null,
    deliveryTotal: 2,
    sentTotal: 1,
    failedTotal: 1,
    readTotal: 0,
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 09:40:00',
    updatedAt: '2026-05-09 09:45:00',
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
    pinned: false,
    scheduledAt: '2026-05-10 09:00:00',
    publishedAt: null,
    offlineAt: null,
    deliveryTotal: 0,
    sentTotal: 0,
    failedTotal: 0,
    readTotal: 0,
    operatorId: 1,
    operatorName: '超级管理员',
    createdAt: '2026-05-09 08:30:00',
    updatedAt: '2026-05-09 08:30:00',
  },
];

const notificationDeliveries: AdminNotificationDelivery[] = [
  {
    id: 5001,
    batchId: 1001,
    receiverId: 1,
    receiverName: '超级管理员',
    status: 'sent',
    readAt: '2026-05-09 10:35:00',
    archivedAt: null,
    sentAt: '2026-05-09 10:30:01',
    failedReason: null,
    retryCount: 0,
    createdAt: '2026-05-09 10:30:01',
    updatedAt: '2026-05-09 10:35:00',
  },
  {
    id: 5002,
    batchId: 1001,
    receiverId: 2,
    receiverName: '运营管理员',
    status: 'sent',
    readAt: null,
    archivedAt: null,
    sentAt: '2026-05-09 10:30:01',
    failedReason: null,
    retryCount: 0,
    createdAt: '2026-05-09 10:30:01',
    updatedAt: '2026-05-09 10:30:01',
  },
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
];

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
  http.get('/api/admin/notification-batches', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const kind = url.searchParams.get('kind') || '';
    const status = url.searchParams.get('status') || '';
    const level = url.searchParams.get('level') || '';
    const type = url.searchParams.get('type') || '';
    const source = url.searchParams.get('source') || '';
    const items = notificationBatches.filter((batch) => {
      if (kind && batch.kind !== kind) {
        return false;
      }
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
  http.post('/api/admin/notification-batches/announcements', async ({ request }) => {
    const body = (await request.json()) as {
      title?: string;
      content?: string;
      level?: AdminMessageLevel;
      type?: string;
      targetType?: AdminNotificationTargetType;
      targetRoleIds?: string[];
      pinned?: boolean;
      scheduledAt?: string | null;
    };
    const nextId = Math.max(...notificationBatches.map((batch) => batch.id)) + 1;
    const isScheduled = Boolean(body.scheduledAt);
    const batch: AdminNotificationBatch = {
      id: nextId,
      title: body.title || '未命名公告',
      content: body.content || '',
      kind: 'announcement',
      level: body.level || 'info',
      type: body.type || 'announcement',
      source: 'system',
      status: (isScheduled ? 'scheduled' : 'published') satisfies AdminNotificationBatchStatus,
      targetType: body.targetType || 'all',
      targetSummary:
        body.targetType === 'role' && body.targetRoleIds?.length
          ? body.targetRoleIds.join('、')
          : '全员',
      pinned: Boolean(body.pinned),
      scheduledAt: body.scheduledAt ?? null,
      publishedAt: isScheduled ? null : now,
      offlineAt: null,
      deliveryTotal: isScheduled ? 0 : 1,
      sentTotal: isScheduled ? 0 : 1,
      failedTotal: 0,
      readTotal: 0,
      operatorId: 1,
      operatorName: '超级管理员',
      createdAt: now,
      updatedAt: now,
    };
    notificationBatches.unshift(batch);
    return success(batch);
  }),
  http.post('/api/admin/notification-batches/:id/publish', ({ params }) => {
    const batch = notificationBatches.find((item) => String(item.id) === String(params.id));
    if (!batch) {
      return fail('SYSTEM.NOTIFICATION_BATCH.NOT_FOUND', '通知批次不存在');
    }
    batch.status = 'published';
    batch.publishedAt = now;
    batch.offlineAt = null;
    batch.updatedAt = now;
    if (batch.deliveryTotal === 0) {
      batch.deliveryTotal = 1;
      batch.sentTotal = 1;
    }
    return success(batch);
  }),
  http.post('/api/admin/notification-batches/:id/offline', ({ params }) => {
    const batch = notificationBatches.find((item) => String(item.id) === String(params.id));
    if (!batch) {
      return fail('SYSTEM.NOTIFICATION_BATCH.NOT_FOUND', '通知批次不存在');
    }
    batch.status = 'offline';
    batch.offlineAt = now;
    batch.updatedAt = now;
    return success(batch);
  }),
  http.get('/api/admin/notification-batches/:id/deliveries', ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const status = url.searchParams.get('status') || '';
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
  http.post(
    '/api/admin/notification-batches/:batchId/deliveries/:deliveryId/resend',
    ({ params }) => {
      const delivery = notificationDeliveries.find(
        (item) =>
          String(item.batchId) === String(params.batchId) &&
          String(item.id) === String(params.deliveryId),
      );
      if (!delivery) {
        return fail('SYSTEM.NOTIFICATION_DELIVERY.NOT_FOUND', '通知投递记录不存在');
      }
      delivery.status = 'sent';
      delivery.sentAt = now;
      delivery.failedReason = null;
      delivery.retryCount += 1;
      delivery.updatedAt = now;
      const batch = notificationBatches.find((item) => item.id === delivery.batchId);
      if (batch) {
        batch.failedTotal = Math.max(0, batch.failedTotal - 1);
        batch.sentTotal += 1;
        batch.updatedAt = now;
      }
      return success(delivery);
    },
  ),
  http.delete('/api/admin/system/users/:id', () =>
    fail('SYSTEM.USER.NOT_FOUND', '管理员用户不存在或已被删除', {
      reason: 'record_missing',
      traceId: 'mock-trace-user-delete',
    }),
  ),
];
