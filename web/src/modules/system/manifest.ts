import { lazy } from 'react';
import { trans } from '@/core/i18n/trans';
import { defineModule } from '@/core/module/types';

export default defineModule({
  id: 'system',
  routes: [
    {
      path: '/organization/departments',
      component: lazy(() => import('./pages/departments')),
      meta: { title: 'system.departments.title', auth: true },
    },
    {
      path: '/organization/users',
      component: lazy(() => import('./pages/users')),
      meta: { title: 'system.users.title', auth: true },
    },
    {
      path: '/organization/roles',
      component: lazy(() => import('./pages/roles')),
      meta: { title: 'system.roles.title', auth: true },
    },
    {
      path: '/system-config/menus',
      component: lazy(() => import('./pages/menus')),
      meta: { title: 'system.menus.title', auth: true },
    },
    {
      path: '/link-frame/:id',
      component: lazy(() => import('./pages/link-frame')),
      meta: {
        title: 'system.menus.type.link',
        auth: true,
        layout: { contentPadding: false },
        tab: { enabled: true, keyMode: 'fullPath' },
      },
    },
    {
      path: '/messages',
      component: lazy(() => import('./pages/messages')),
      meta: { title: 'system.messages.title', auth: true },
    },
    {
      path: '/message-management/notifications',
      component: lazy(() => import('./pages/notification-management')),
      meta: { title: 'system.notificationManagement.title', auth: true },
    },
    {
      path: '/message-management/announcements',
      component: lazy(() => import('./pages/announcement-management')),
      meta: { title: 'system.announcementManagement.title', auth: true },
    },
  ],
  notification: {
    sources: {
      system: { label: trans('system.messages.source.system', '系统') },
    },
  },
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
  errors: {
    'SYSTEM.USER.USERNAME_EXISTS': {
      title: trans('system.errors.user.usernameExists.title', '用户名已存在'),
      description: trans(
        'system.errors.user.usernameExists.description',
        '该用户名已经被其他成员账号占用。',
      ),
      causes: [
        trans(
          'system.errors.user.usernameExists.cause.duplicate',
          '新增或编辑成员时使用了重复用户名',
        ),
        trans('system.errors.user.usernameExists.cause.imported', '导入数据中存在同名账号'),
      ],
      suggestions: [
        trans('system.errors.user.usernameExists.suggestion.rename', '更换用户名'),
        trans(
          'system.errors.user.usernameExists.suggestion.search',
          '在成员列表中搜索该用户名确认是否已存在',
        ),
      ],
      severity: 'warning',
    },
    'SYSTEM.USER.NOT_FOUND': {
      title: trans('system.errors.user.notFound.title', '成员不存在'),
      description: trans(
        'system.errors.user.notFound.description',
        '目标成员账号不存在，可能已被删除或当前账号无权查看。',
      ),
      causes: [
        trans('system.errors.user.notFound.cause.deleted', '数据已被其他管理员删除'),
        trans('system.errors.user.notFound.cause.stale', '当前列表数据不是最新状态'),
      ],
      suggestions: [
        trans('system.errors.user.notFound.suggestion.refresh', '刷新列表后重试'),
        trans(
          'system.errors.user.notFound.suggestion.permission',
          '确认当前账号是否有查看该用户的权限',
        ),
      ],
      severity: 'warning',
    },
  },
});
