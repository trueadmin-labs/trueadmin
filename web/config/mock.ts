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
