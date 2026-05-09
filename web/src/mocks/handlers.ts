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
    id: 1002,
    title: '配置项等待确认',
    content: '配置项系统参数 01 已提交变更，请进入 CRUD 示例页面查看处理。',
    kind: 'notification',
    level: 'info',
    type: 'system',
    source: 'plugin.true-admin.examples',
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
  http.get('/api/admin/system/users/role-options', () =>
    success([
      { id: 1, code: 'super-admin', name: '超级管理员', status: 'enabled' },
      { id: 2, code: 'operator', name: '运营管理员', status: 'enabled' },
      { id: 3, code: 'auditor', name: '审计员', status: 'enabled' },
    ]),
  ),
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
  http.get('/api/admin/notifications', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = url.searchParams.get('status') || '';
    const level = url.searchParams.get('level') || '';
    const type = url.searchParams.get('type') || '';
    const source = url.searchParams.get('source') || '';
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
        const searchable = [batch.title, batch.content, batch.source, batch.type, batch.operatorName]
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
  http.get('/api/admin/notifications/:id/deliveries', ({ params, request }) => {
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
    return success({ items: items.slice(start, start + pageSize), total: items.length, page, pageSize });
  }),
  http.post('/api/admin/notifications/:id/resend', ({ params }) => {
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
  http.get('/api/admin/announcements', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = url.searchParams.get('status') || '';
    const level = url.searchParams.get('level') || '';
    const type = url.searchParams.get('type') || '';
    const source = url.searchParams.get('source') || '';
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
        const searchable = [announcement.title, announcement.content, announcement.source, announcement.type, announcement.operatorName]
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
    return success({ items: items.slice(start, start + pageSize), meta: { statusStats }, total: items.length, page, pageSize });
  }),
  http.post('/api/admin/announcements', async ({ request }) => {
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
  http.put('/api/admin/announcements/:id', async ({ params, request }) => {
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
    announcement.targetRoleIds = announcement.targetType === 'role' ? (body.targetRoleIds ?? []) : [];
    announcement.targetSummary = getNotificationTargetSummary({ targetType: announcement.targetType, targetRoleIds: announcement.targetRoleIds });
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
  http.delete('/api/admin/announcements/:id', ({ params }) => {
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
  http.post('/api/admin/announcements/:id/publish', ({ params }) => {
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
  http.post('/api/admin/announcements/:id/offline', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    announcement.status = 'offline';
    announcement.offlineAt = now;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.post('/api/admin/announcements/:id/restore', ({ params }) => {
    const announcement = announcements.find((item) => String(item.id) === String(params.id));
    if (!announcement) {
      return fail('SYSTEM.ANNOUNCEMENT.NOT_FOUND', '公告不存在');
    }
    announcement.status = 'active';
    announcement.publishedAt = announcement.publishedAt ?? now;
    announcement.scheduledAt = null;
    announcement.offlineAt = null;
    announcement.expireAt = announcement.expireAt && new Date(announcement.expireAt).getTime() <= Date.now() ? null : announcement.expireAt;
    announcement.updatedAt = now;
    return success(announcement);
  }),
  http.post('/api/admin/announcements/:id/cancel-scheduled', ({ params }) => {
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
  http.delete('/api/admin/system/users/:id', () =>
    fail('SYSTEM.USER.NOT_FOUND', '管理员用户不存在或已被删除', {
      reason: 'record_missing',
      traceId: 'mock-trace-user-delete',
    }),
  ),
];
