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
import type { AdminMenu } from '@/modules/system/types/menu';
import type {
  AdminRole,
  AdminRoleDataPolicy,
  DataPolicyMetadata,
} from '@/modules/system/types/role';

const success = <T>(data: T) => HttpResponse.json({ code: 'SUCCESS', message: 'success', data });

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

type DepartmentMockNode = {
  id: number;
  name: string;
  code: string;
  children?: DepartmentMockNode[];
};

const users = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: '',
    preferences: {},
    status: 'enabled',
    primaryDeptId: 1,
    primaryDeptName: '总部',
    primaryDeptPath: '总部',
    deptIds: [1],
    positions: [
      {
        id: 1,
        deptId: 1,
        deptName: '总部',
        deptPath: '总部',
        code: 'super-admin',
        name: '超级管理员',
        status: 'enabled',
        primary: true,
        roleIds: [1],
        roleNames: ['超级管理员'],
      },
    ],
    positionIds: [1],
    roles: ['super-admin'],
    roleNames: ['超级管理员'],
    roleIds: [1],
    directRoles: ['super-admin'],
    directRoleNames: ['超级管理员'],
    directRoleIds: [1],
    createdAt: '2026-05-06 10:00:00',
    updatedAt: '2026-05-06 10:00:00',
  },
];

const departmentTree: DepartmentMockNode[] = [
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

type MockRole = AdminRole & {
  dataPolicies: AdminRoleDataPolicy[];
  menuIds: number[];
  parentId?: number;
  level?: number;
  path?: string;
};

const roleOptions: MockRole[] = [
  {
    id: 1,
    parentId: 0,
    code: 'super-admin',
    name: '超级管理员',
    level: 1,
    path: '',
    sort: 0,
    status: 'enabled',
    builtin: true,
    menuIds: [100, 110, 111, 112, 113, 120, 121, 122, 123, 130, 131, 132, 133, 140, 141],
    dataPolicies: [
      {
        id: 1,
        roleId: 1,
        resource: 'admin_user',
        strategy: 'organization',
        effect: 'allow',
        scope: 'all',
        config: {},
        status: 'enabled',
        sort: 0,
      },
    ],
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
    builtin: false,
    menuIds: [100, 110, 120, 130],
    dataPolicies: [
      {
        id: 2,
        roleId: 2,
        resource: 'admin_user',
        strategy: 'organization',
        effect: 'allow',
        scope: 'department_and_children',
        config: {},
        status: 'enabled',
        sort: 0,
      },
    ],
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
    builtin: false,
    menuIds: [100, 140],
    dataPolicies: [
      {
        id: 3,
        roleId: 3,
        resource: 'admin_announcement',
        strategy: 'organization',
        effect: 'allow',
        scope: 'self',
        config: {},
        status: 'enabled',
        sort: 0,
      },
    ],
  },
];

const roleTree = [
  {
    ...roleOptions[0],
    children: [roleOptions[1], roleOptions[2]],
  },
];

const menuPermissionTree: AdminMenu[] = [
  {
    id: 100,
    parentId: 0,
    code: 'organization',
    type: 'directory',
    name: '组织权限',
    path: '/organization',
    url: '',
    openMode: '',
    showLinkHeader: false,
    icon: 'ApartmentOutlined',
    permission: '',
    source: 'code',
    sort: 30,
    status: 'enabled',
    children: [
      {
        id: 110,
        parentId: 100,
        code: 'system.departments',
        type: 'menu',
        name: '部门管理',
        path: '/organization/departments',
        url: '',
        openMode: '',
        showLinkHeader: false,
        icon: 'TeamOutlined',
        permission: 'system:department:list',
        source: 'code',
        sort: 10,
        status: 'enabled',
        children: [
          {
            id: 111,
            parentId: 110,
            code: 'system.departments.create',
            type: 'button',
            name: '新增部门',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:department:create',
            source: 'code',
            sort: 11,
            status: 'enabled',
          },
          {
            id: 112,
            parentId: 110,
            code: 'system.departments.update',
            type: 'button',
            name: '编辑部门',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:department:update',
            source: 'code',
            sort: 12,
            status: 'enabled',
          },
          {
            id: 113,
            parentId: 110,
            code: 'system.departments.delete',
            type: 'button',
            name: '删除部门',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:department:delete',
            source: 'code',
            sort: 13,
            status: 'enabled',
          },
        ],
      },
      {
        id: 120,
        parentId: 100,
        code: 'system.users',
        type: 'menu',
        name: '成员管理',
        path: '/organization/users',
        url: '',
        openMode: '',
        showLinkHeader: false,
        icon: 'UserOutlined',
        permission: 'system:user:list',
        source: 'code',
        sort: 20,
        status: 'enabled',
        children: [
          {
            id: 121,
            parentId: 120,
            code: 'system.users.create',
            type: 'button',
            name: '新增成员',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:user:create',
            source: 'code',
            sort: 21,
            status: 'enabled',
          },
          {
            id: 122,
            parentId: 120,
            code: 'system.users.update',
            type: 'button',
            name: '编辑成员',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:user:update',
            source: 'code',
            sort: 22,
            status: 'enabled',
          },
          {
            id: 123,
            parentId: 120,
            code: 'system.users.delete',
            type: 'button',
            name: '删除成员',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:user:delete',
            source: 'code',
            sort: 23,
            status: 'enabled',
          },
        ],
      },
      {
        id: 130,
        parentId: 100,
        code: 'system.positions',
        type: 'button',
        name: '岗位管理',
        path: '/organization/positions',
        url: '',
        openMode: '',
        showLinkHeader: false,
        icon: 'IdcardOutlined',
        permission: 'system:position:list',
        source: 'code',
        sort: 25,
        status: 'enabled',
        children: [
          {
            id: 131,
            parentId: 130,
            code: 'system.positions.create',
            type: 'button',
            name: '新增岗位',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:position:create',
            source: 'code',
            sort: 26,
            status: 'enabled',
          },
          {
            id: 132,
            parentId: 130,
            code: 'system.positions.update',
            type: 'button',
            name: '编辑岗位',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:position:update',
            source: 'code',
            sort: 27,
            status: 'enabled',
          },
          {
            id: 133,
            parentId: 130,
            code: 'system.positions.delete',
            type: 'button',
            name: '删除岗位',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:position:delete',
            source: 'code',
            sort: 28,
            status: 'enabled',
          },
        ],
      },
      {
        id: 140,
        parentId: 100,
        code: 'system.roles',
        type: 'menu',
        name: '角色管理',
        path: '/organization/roles',
        url: '',
        openMode: '',
        showLinkHeader: false,
        icon: 'LockOutlined',
        permission: 'system:role:list',
        source: 'code',
        sort: 30,
        status: 'enabled',
        children: [
          {
            id: 141,
            parentId: 140,
            code: 'system.roles.authorize',
            type: 'button',
            name: '角色授权',
            path: '',
            url: '',
            openMode: '',
            showLinkHeader: false,
            icon: '',
            permission: 'system:role:authorize',
            source: 'code',
            sort: 31,
            status: 'enabled',
          },
        ],
      },
    ],
  },
];

const dataPolicyMetadata: DataPolicyMetadata = {
  resources: [
    {
      key: 'admin_user',
      label: '成员管理',
      i18n: 'dataPolicy.resource.adminUser',
      strategies: ['organization'],
      sort: 10,
    },
    {
      key: 'admin_position',
      label: '岗位管理',
      i18n: 'dataPolicy.resource.adminPosition',
      strategies: ['organization'],
      sort: 25,
    },
  ],
  strategies: [
    {
      key: 'organization',
      label: '组织范围',
      i18n: 'dataPolicy.strategy.organization',
      scopes: [
        { key: 'all', label: '全部数据', i18n: 'dataPolicy.scope.all', sort: 10 },
        { key: 'department', label: '本部门', i18n: 'dataPolicy.scope.department', sort: 20 },
        {
          key: 'department_and_children',
          label: '本部门及子部门',
          i18n: 'dataPolicy.scope.departmentAndChildren',
          sort: 30,
        },
        { key: 'self', label: '仅本人', i18n: 'dataPolicy.scope.self', sort: 40 },
        {
          key: 'custom_departments',
          label: '自定义部门',
          i18n: 'dataPolicy.scope.customDepartments',
          sort: 50,
          configSchema: [
            {
              key: 'deptIds',
              type: 'department_tree',
              label: '可见部门',
              i18n: 'dataPolicy.config.deptIds',
            },
          ],
        },
        {
          key: 'custom_departments_and_children',
          label: '自定义部门及子部门',
          i18n: 'dataPolicy.scope.customDepartmentsAndChildren',
          sort: 60,
          configSchema: [
            {
              key: 'deptIds',
              type: 'department_tree',
              label: '可见部门',
              i18n: 'dataPolicy.config.deptIds',
            },
          ],
        },
      ],
    },
  ],
};

const positions = [
  {
    id: 1,
    deptId: 1,
    deptName: '总部',
    deptPath: '总部',
    code: 'super-admin',
    name: '超级管理员',
    type: 'system',
    isLeadership: true,
    description: '系统内置超级管理员岗位',
    sort: 0,
    status: 'enabled',
    roleIds: [1],
    roleNames: ['超级管理员'],
    memberCount: 1,
    createdAt: '2026-05-06 10:00:00',
    updatedAt: '2026-05-06 10:00:00',
  },
  {
    id: 2,
    deptId: 11,
    deptName: '产品研发部',
    deptPath: '总部/产品研发部',
    code: 'rd-operator',
    name: '研发运营',
    type: 'normal',
    isLeadership: false,
    description: '研发部门日常运营岗位',
    sort: 10,
    status: 'enabled',
    roleIds: [2],
    roleNames: ['运营管理员'],
    memberCount: 0,
    createdAt: '2026-05-06 10:00:00',
    updatedAt: '2026-05-06 10:00:00',
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

const paginate = <T>(items: T[], page: number, pageSize: number) => {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
};

const positionMemberIds = (positionId: number) =>
  users.filter((user) => user.positionIds.includes(positionId)).map((user) => user.id);

const refreshPositionMemberCounts = () => {
  for (const position of positions) {
    position.memberCount = positionMemberIds(position.id).length;
  }
};

const toUserPosition = (position: (typeof positions)[number], primary = false) => ({
  id: position.id,
  deptId: position.deptId,
  deptName: position.deptName,
  deptPath: position.deptPath,
  code: position.code,
  name: position.name,
  status: position.status,
  primary,
  roleIds: position.roleIds,
  roleNames: position.roleNames,
});

const refreshUserPositions = (user: (typeof users)[number]) => {
  user.positions = user.positionIds
    .map((positionId, index) => {
      const position = positions.find((item) => item.id === positionId);

      return position ? toUserPosition(position, index === 0) : null;
    })
    .filter((position): position is NonNullable<typeof position> => Boolean(position));
};

const refreshUserEffectiveRoles = (user: (typeof users)[number]) => {
  const positionRoleIds = user.positionIds.flatMap((positionId) => {
    const position = positions.find((item) => item.id === positionId);
    return position?.roleIds ?? [];
  });
  user.roleIds = Array.from(new Set([...user.directRoleIds, ...positionRoleIds]));
  user.roles = roleOptions
    .filter((role) => user.roleIds.includes(role.id))
    .map((role) => role.code);
  user.roleNames = roleOptions
    .filter((role) => user.roleIds.includes(role.id))
    .map((role) => role.name);
};

const syncPositionMembers = (positionId: number, userIds: number[]) => {
  const position = positions.find((item) => item.id === positionId);
  if (!position) {
    return;
  }

  const nextUserIds = new Set(userIds);
  for (const user of users) {
    const hasPosition = user.positionIds.includes(positionId);
    const shouldHavePosition = nextUserIds.has(user.id);
    if (shouldHavePosition && !hasPosition) {
      user.positionIds.push(positionId);
      refreshUserPositions(user);
    }
    if (!shouldHavePosition && hasPosition) {
      user.positionIds = user.positionIds.filter((id) => id !== positionId);
      refreshUserPositions(user);
    }
    refreshUserEffectiveRoles(user);
  }
  refreshPositionMemberCounts();
};

const flattenDepartments = (items: DepartmentMockNode[]): DepartmentMockNode[] =>
  items.flatMap((item) => [item, ...flattenDepartments(item.children ?? [])]);

const departmentById = (deptId: number) =>
  flattenDepartments(departmentTree).find((department) => department.id === deptId);

const departmentPathById = (deptId: number) => {
  const department = departmentById(deptId);
  if (!department) {
    return '';
  }
  if (deptId >= 10 && deptId < 20) {
    return `总部/${department.name}`;
  }
  if (deptId >= 20 && deptId < 30) {
    return `华东分公司/${department.name}`;
  }
  return department.name;
};

const roleNamesByIds = (roleIds: number[]) =>
  roleOptions.filter((role) => roleIds.includes(role.id)).map((role) => role.name);

const roleCodesByIds = (roleIds: number[]) =>
  roleOptions.filter((role) => roleIds.includes(role.id)).map((role) => role.code);

const toRoleListItem = (role: MockRole): AdminRole => ({
  id: role.id,
  code: role.code,
  name: role.name,
  sort: role.sort,
  status: role.status,
  builtin: role.builtin,
});

const toRoleDetail = (role: MockRole): AdminRole => ({
  ...toRoleListItem(role),
  menuIds: role.menuIds,
  dataPolicies: role.dataPolicies,
});

const roleById = (id: number) => roleOptions.find((role) => role.id === id);

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
      roleIds: [1],
      effectiveRoles: ['super-admin'],
      permissions: ['*'],
      primaryDeptId: users[0].primaryDeptId,
      deptIds: users[0].deptIds,
      operationDeptId: users[0].primaryDeptId,
      positions: users[0].positions,
      directRoles: users[0].directRoles,
      directRoleIds: users[0].directRoleIds,
      positionRoles: users[0].roles,
      positionRoleBindings: users[0].positions.flatMap((position) =>
        position.roleIds.map((roleId, index) => ({
          positionId: position.id,
          positionName: position.name,
          deptId: position.deptId,
          deptName: position.deptName,
          roleId,
          roleCode: roleCodesByIds([roleId])[0] ?? '',
          roleName: position.roleNames[index] ?? '',
        })),
      ),
    }),
  ),
  http.get('/api/admin/system-config/menu-tree', () =>
    success([
      {
        code: 'true-admin.examples',
        title: '开发示例',
        i18n: 'menu.true-admin.examples',
        path: '/examples',
        icon: 'true-admin.examples.logo',
        type: 'directory',
        status: 'enabled',
        children: [
          {
            code: 'true-admin.examples.permission',
            title: '权限展示',
            i18n: 'menu.true-admin.examples.permission',
            path: '/examples/permission',
            icon: 'LockOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.loading',
            title: '加载态展示',
            i18n: 'menu.true-admin.examples.loading',
            path: '/examples/loading',
            icon: 'SyncOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.pageContainer',
            title: '页面容器',
            i18n: 'menu.true-admin.examples.pageContainer',
            path: '/examples/page-container',
            icon: 'AppstoreOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.crud',
            title: 'CRUD 页面',
            i18n: 'menu.true-admin.examples.crud',
            path: '/examples/crud',
            icon: 'TableOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.components',
            title: '通用组件',
            i18n: 'menu.true-admin.examples.components',
            path: '/examples/components',
            icon: 'AppstoreOutlined',
            type: 'directory',
            status: 'enabled',
            children: [
              {
                code: 'true-admin.examples.formControls',
                title: '表单控件',
                i18n: 'menu.true-admin.examples.formControls',
                path: '/examples/form-controls',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
              {
                code: 'true-admin.examples.attachments',
                title: '附件上传',
                i18n: 'menu.true-admin.examples.attachments',
                path: '/examples/attachments',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
              {
                code: 'true-admin.examples.display',
                title: '数据展示',
                i18n: 'menu.true-admin.examples.display',
                path: '/examples/display',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
              {
                code: 'true-admin.examples.markdown',
                title: 'Markdown',
                i18n: 'menu.true-admin.examples.markdown',
                path: '/examples/markdown',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
              {
                code: 'true-admin.examples.actions',
                title: '操作反馈',
                i18n: 'menu.true-admin.examples.actions',
                path: '/examples/actions',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
              {
                code: 'true-admin.examples.audit',
                title: '审计日志',
                i18n: 'menu.true-admin.examples.audit',
                path: '/examples/audit',
                icon: 'AppstoreOutlined',
                type: 'menu',
                status: 'enabled',
              },
            ],
          },
          {
            code: 'true-admin.examples.selector',
            title: '选择器',
            i18n: 'menu.true-admin.examples.selector',
            path: '/examples/selector',
            icon: 'AppstoreOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.stream',
            title: '流式响应',
            i18n: 'menu.true-admin.examples.stream',
            path: '/examples/stream',
            icon: 'SyncOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.notification',
            title: '站内消息',
            i18n: 'menu.true-admin.examples.notification',
            path: '/examples/notification',
            icon: 'BellOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.complexForm',
            title: '复杂表单',
            i18n: 'menu.true-admin.examples.complexForm',
            path: '/examples/complex-form',
            icon: 'AppstoreOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.complexDetail',
            title: '复杂详情',
            i18n: 'menu.true-admin.examples.complexDetail',
            path: '/examples/complex-detail',
            icon: 'AppstoreOutlined',
            type: 'menu',
            status: 'enabled',
          },
          {
            code: 'true-admin.examples.multilevel',
            title: '多级菜单',
            i18n: 'menu.true-admin.examples.multilevel',
            path: '/examples/multilevel',
            icon: 'AppstoreOutlined',
            type: 'directory',
            status: 'enabled',
            children: [
              {
                code: 'true-admin.examples.multilevel.second',
                title: '二级菜单',
                i18n: 'menu.true-admin.examples.multilevel.second',
                path: '/examples/multilevel/second',
                icon: 'AppstoreOutlined',
                type: 'directory',
                status: 'enabled',
                children: [
                  {
                    code: 'true-admin.examples.multilevel.second.third',
                    title: '三级菜单',
                    i18n: 'menu.true-admin.examples.multilevel.third',
                    path: '/examples/multilevel/second/third',
                    icon: 'AppstoreOutlined',
                    type: 'menu',
                    status: 'enabled',
                  },
                ],
              },
            ],
          },
        ],
      },
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
    const positionId = Number(getCrudParam(url, 'positionId', '0'));
    const deptId = Number(getCrudParam(url, 'deptId', '0'));
    const filtered = users.filter((user) => {
      if (positionId > 0 && !user.positionIds.includes(positionId)) {
        return false;
      }
      if (deptId > 0 && !user.deptIds.includes(deptId)) {
        return false;
      }
      return true;
    });
    return success({
      items: paginate(filtered, page, pageSize),
      total: filtered.length,
      page,
      pageSize,
    });
  }),
  http.post('/api/admin/organization/users', async ({ request }) => {
    const body = (await request.json()) as {
      deptIds?: number[];
      nickname?: string;
      password?: string;
      positionIds?: number[];
      primaryDeptId?: number | null;
      roleIds?: number[];
      status?: 'enabled' | 'disabled';
      username?: string;
    };
    const username = body.username?.trim() ?? '';
    if (!username) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '请输入用户名');
    }
    if (users.some((user) => user.username === username)) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '用户名已存在', {
        field: 'username',
        reason: 'duplicated',
      });
    }

    const deptIds = Array.from(new Set((body.deptIds ?? []).map(Number).filter((id) => id > 0)));
    const positionIds = Array.from(
      new Set((body.positionIds ?? []).map(Number).filter((id) => id > 0)),
    );
    if (deptIds.length === 0 || positionIds.length === 0) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '请选择部门和岗位');
    }

    const primaryDeptId =
      body.primaryDeptId && deptIds.includes(Number(body.primaryDeptId))
        ? Number(body.primaryDeptId)
        : deptIds[0];
    const primaryDepartment = departmentById(primaryDeptId);
    const directRoleIds = Array.from(
      new Set((body.roleIds ?? []).map(Number).filter((id) => id > 0)),
    );
    const user: (typeof users)[number] = {
      id: Math.max(...users.map((item) => item.id)) + 1,
      username,
      nickname: body.nickname?.trim() || username,
      avatar: '',
      preferences: {},
      status: body.status ?? 'enabled',
      primaryDeptId,
      primaryDeptName: primaryDepartment?.name ?? '',
      primaryDeptPath: departmentPathById(primaryDeptId),
      deptIds,
      positions: [],
      positionIds,
      roles: [],
      roleNames: [],
      roleIds: [],
      directRoles: roleCodesByIds(directRoleIds),
      directRoleNames: roleNamesByIds(directRoleIds),
      directRoleIds,
      createdAt: now,
      updatedAt: now,
    };

    refreshUserPositions(user);
    refreshUserEffectiveRoles(user);
    users.push(user);
    refreshPositionMemberCounts();

    return success(user);
  }),
  http.get('/api/admin/organization/users/:id', ({ params }) => {
    const user = users.find((item) => String(item.id) === String(params.id));
    if (!user) {
      return fail('SYSTEM.USER.NOT_FOUND', '成员不存在或已被删除');
    }

    return success(user);
  }),
  http.put('/api/admin/organization/users/:id', async ({ params, request }) => {
    const user = users.find((item) => String(item.id) === String(params.id));
    if (!user) {
      return fail('SYSTEM.USER.NOT_FOUND', '成员不存在或已被删除');
    }

    const body = (await request.json()) as Partial<typeof user> & { password?: string };
    const username = body.username?.trim() ?? user.username;
    if (users.some((item) => item.id !== user.id && item.username === username)) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '用户名已存在', {
        field: 'username',
        reason: 'duplicated',
      });
    }

    const deptIds =
      body.deptIds === undefined
        ? user.deptIds
        : Array.from(new Set(body.deptIds.map(Number).filter((id) => id > 0)));
    const positionIds =
      body.positionIds === undefined
        ? user.positionIds
        : Array.from(new Set(body.positionIds.map(Number).filter((id) => id > 0)));
    const primaryDeptId =
      body.primaryDeptId && deptIds.includes(Number(body.primaryDeptId))
        ? Number(body.primaryDeptId)
        : (deptIds[0] ?? user.primaryDeptId);
    const primaryDepartment = primaryDeptId ? departmentById(primaryDeptId) : undefined;

    user.username = username;
    user.nickname = body.nickname?.trim() || user.nickname;
    user.status = body.status ?? user.status;
    user.deptIds = deptIds;
    user.positionIds = positionIds;
    user.primaryDeptId = primaryDeptId;
    user.primaryDeptName = primaryDepartment?.name ?? '';
    user.primaryDeptPath = primaryDeptId ? departmentPathById(primaryDeptId) : '';
    if (body.roleIds !== undefined) {
      user.directRoleIds = Array.from(new Set(body.roleIds.map(Number).filter((id) => id > 0)));
      user.directRoles = roleCodesByIds(user.directRoleIds);
      user.directRoleNames = roleNamesByIds(user.directRoleIds);
    }
    user.updatedAt = now;

    refreshUserPositions(user);
    refreshUserEffectiveRoles(user);
    refreshPositionMemberCounts();

    return success(user);
  }),
  http.delete('/api/admin/organization/users/:id', ({ params }) => {
    const index = users.findIndex((item) => String(item.id) === String(params.id));
    if (index < 0 || users[index].id === 1) {
      return fail('SYSTEM.USER.NOT_FOUND', '成员不存在或已被删除', {
        reason: 'record_missing',
        traceId: 'mock-trace-user-delete',
      });
    }

    users.splice(index, 1);
    refreshPositionMemberCounts();

    return success(null);
  }),
  http.get('/api/admin/organization/roles/tree', () => success(roleTree)),
  http.get('/api/admin/organization/roles/options', () => success(roleOptions)),
  http.get('/api/admin/organization/roles', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = getCrudFilter(url, 'status');
    const filtered = roleOptions.filter((role) => {
      if (keyword && !`${role.name} ${role.code}`.toLowerCase().includes(keyword)) {
        return false;
      }
      if (status && role.status !== status) {
        return false;
      }

      return true;
    });

    return success({
      items: paginate(filtered.map(toRoleListItem), page, pageSize),
      total: filtered.length,
      page,
      pageSize,
    });
  }),
  http.post('/api/admin/organization/roles', async ({ request }) => {
    const body = (await request.json()) as Partial<AdminRole> & {
      dataPolicies?: AdminRoleDataPolicy[];
      menuIds?: number[];
    };
    const code = body.code?.trim() ?? '';
    const name = body.name?.trim() ?? '';
    if (!code || !name) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '请输入角色名称和编码');
    }
    if (roleOptions.some((role) => role.code === code)) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '角色编码已存在', {
        field: 'code',
        reason: 'duplicated',
      });
    }

    const role: MockRole = {
      id: Math.max(...roleOptions.map((item) => item.id)) + 1,
      code,
      name,
      sort: body.sort ?? 0,
      status: body.status ?? 'enabled',
      builtin: false,
      menuIds: body.menuIds ?? [],
      dataPolicies: body.dataPolicies ?? [],
    };
    roleOptions.push(role);

    return success(toRoleDetail(role));
  }),
  http.get('/api/admin/organization/roles/:id', ({ params }) => {
    const role = roleById(Number(params.id));
    if (!role) {
      return fail('SYSTEM.ROLE.NOT_FOUND', '角色不存在或已被删除');
    }

    return success(toRoleDetail(role));
  }),
  http.put('/api/admin/organization/roles/:id', async ({ params, request }) => {
    const role = roleById(Number(params.id));
    if (!role) {
      return fail('SYSTEM.ROLE.NOT_FOUND', '角色不存在或已被删除');
    }
    if (role.builtin) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '内置角色不能修改', {
        field: 'role',
        reason: 'cannot_update_builtin_role',
      });
    }

    const body = (await request.json()) as Partial<AdminRole> & {
      dataPolicies?: AdminRoleDataPolicy[];
      menuIds?: number[];
    };
    const code = body.code?.trim() ?? role.code;
    if (roleOptions.some((item) => item.id !== role.id && item.code === code)) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '角色编码已存在', {
        field: 'code',
        reason: 'duplicated',
      });
    }

    role.code = code;
    role.name = body.name?.trim() || role.name;
    role.sort = body.sort ?? role.sort;
    role.status = body.status ?? role.status;
    if (body.menuIds !== undefined) {
      role.menuIds = body.menuIds;
    }
    if (body.dataPolicies !== undefined) {
      role.dataPolicies = body.dataPolicies;
    }

    return success(toRoleDetail(role));
  }),
  http.delete('/api/admin/organization/roles/:id', ({ params }) => {
    const index = roleOptions.findIndex((role) => role.id === Number(params.id));
    if (index < 0) {
      return fail('SYSTEM.ROLE.NOT_FOUND', '角色不存在或已被删除');
    }
    if (roleOptions[index].builtin) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '内置角色不能删除', {
        field: 'role',
        reason: 'cannot_delete_builtin_role',
      });
    }

    roleOptions.splice(index, 1);
    return success(null);
  }),
  http.post('/api/admin/organization/roles/:id/authorize', async ({ params, request }) => {
    const role = roleById(Number(params.id));
    if (!role) {
      return fail('SYSTEM.ROLE.NOT_FOUND', '角色不存在或已被删除');
    }
    if (role.builtin) {
      return fail('KERNEL.REQUEST.VALIDATION_FAILED', '内置角色不能授权', {
        field: 'role',
        reason: 'cannot_authorize_builtin_role',
      });
    }

    const body = (await request.json()) as {
      dataPolicies?: AdminRoleDataPolicy[];
      menuIds?: number[];
    };
    role.menuIds = body.menuIds ?? [];
    role.dataPolicies = body.dataPolicies ?? [];

    return success(toRoleDetail(role));
  }),
  http.get('/api/admin/system-config/menus/tree', () => success(menuPermissionTree)),
  http.get('/api/admin/system-config/data-policies/metadata', () => success(dataPolicyMetadata)),
  http.get('/api/admin/organization/positions', ({ request }) => {
    refreshPositionMemberCounts();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 20);
    const keyword = url.searchParams.get('keyword')?.trim().toLowerCase();
    const status = getCrudFilter(url, 'status');
    const deptIds = new Set(
      getCrudFilter(url, 'deptId')
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    );
    const filtered = positions.filter((position) => {
      if (keyword && !`${position.name} ${position.code}`.toLowerCase().includes(keyword)) {
        return false;
      }
      if (status && position.status !== status) {
        return false;
      }
      if (deptIds.size > 0 && !deptIds.has(position.deptId)) {
        return false;
      }
      return true;
    });

    return success({
      items: paginate(filtered, page, pageSize),
      total: filtered.length,
      page,
      pageSize,
    });
  }),
  http.get('/api/admin/organization/positions/options', ({ request }) => {
    const url = new URL(request.url);
    const deptIds = new Set(
      (url.searchParams.get('deptIds') ?? '')
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    );
    return success(
      positions
        .filter((position) => position.status === 'enabled')
        .filter((position) => deptIds.size === 0 || deptIds.has(position.deptId))
        .map(({ memberCount: _memberCount, roleNames: _roleNames, ...position }) => position),
    );
  }),
  http.post('/api/admin/organization/positions', async ({ request }) => {
    const body = (await request.json()) as {
      code: string;
      deptId: number;
      description?: string;
      isLeadership?: boolean;
      name: string;
      roleIds?: number[];
      sort?: number;
      status?: 'enabled' | 'disabled';
      type?: string;
    };
    const department = departmentById(Number(body.deptId));
    if (!department) {
      return fail('SYSTEM.DEPARTMENT.NOT_FOUND', '部门不存在');
    }

    const roleIds = body.roleIds ?? [];
    const position = {
      id: Math.max(...positions.map((item) => item.id)) + 1,
      deptId: Number(body.deptId),
      deptName: department.name,
      deptPath: departmentPathById(Number(body.deptId)),
      code: body.code,
      name: body.name,
      type: body.type ?? 'normal',
      isLeadership: Boolean(body.isLeadership),
      description: body.description ?? '',
      sort: body.sort ?? 0,
      status: body.status ?? 'enabled',
      roleIds,
      roleNames: roleNamesByIds(roleIds),
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    positions.push(position);

    return success(position);
  }),
  http.put('/api/admin/organization/positions/:id', async ({ params, request }) => {
    const position = positions.find((item) => String(item.id) === String(params.id));
    if (!position) {
      return fail('SYSTEM.POSITION.NOT_FOUND', '岗位不存在或已被删除');
    }

    const body = (await request.json()) as Partial<typeof position>;
    const department = departmentById(Number(body.deptId ?? position.deptId));
    if (!department) {
      return fail('SYSTEM.DEPARTMENT.NOT_FOUND', '部门不存在');
    }

    position.deptId = Number(body.deptId ?? position.deptId);
    position.deptName = department.name;
    position.deptPath = departmentPathById(position.deptId);
    position.code = body.code ?? position.code;
    position.name = body.name ?? position.name;
    position.type = body.type ?? position.type;
    position.isLeadership = Boolean(body.isLeadership ?? position.isLeadership);
    position.description = body.description ?? position.description;
    position.sort = body.sort ?? position.sort;
    position.status = body.status ?? position.status;
    position.roleIds = body.roleIds ?? position.roleIds;
    position.roleNames = roleNamesByIds(position.roleIds);
    position.updatedAt = now;

    return success(position);
  }),
  http.delete('/api/admin/organization/positions/:id', ({ params }) => {
    const index = positions.findIndex((item) => String(item.id) === String(params.id));
    if (index < 0) {
      return fail('SYSTEM.POSITION.NOT_FOUND', '岗位不存在或已被删除');
    }
    if (positionMemberIds(positions[index].id).length > 0) {
      return fail('SYSTEM.POSITION.HAS_MEMBERS', '岗位下仍有成员，不能删除');
    }

    positions.splice(index, 1);
    return success(null);
  }),
  http.get('/api/admin/organization/positions/:id/member-ids', ({ params }) => {
    const positionId = Number(params.id);
    if (!positions.some((position) => position.id === positionId)) {
      return fail('SYSTEM.POSITION.NOT_FOUND', '岗位不存在或已被删除');
    }

    return success(positionMemberIds(positionId));
  }),
  http.put('/api/admin/organization/positions/:id/members', async ({ params, request }) => {
    const positionId = Number(params.id);
    const position = positions.find((item) => item.id === positionId);
    if (!position) {
      return fail('SYSTEM.POSITION.NOT_FOUND', '岗位不存在或已被删除');
    }

    const body = (await request.json()) as { userIds?: number[] };
    syncPositionMembers(positionId, body.userIds ?? []);

    return success(position);
  }),
  http.get('/api/admin/organization/positions/:id', ({ params }) => {
    refreshPositionMemberCounts();
    const position = positions.find((item) => String(item.id) === String(params.id));
    if (!position) {
      return fail('SYSTEM.POSITION.NOT_FOUND', '岗位不存在或已被删除');
    }

    return success(position);
  }),
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
  http.get(
    '/api/admin/messages/stream',
    () =>
      new HttpResponse('event: sync_required\ndata: {"type":"sync_required","reason":"mock"}\n\n', {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream; charset=utf-8',
        },
      }),
  ),
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
];
