import { lazy } from 'react';
import { trans } from '@/core/i18n/trans';
import { defineModule } from '@/core/module/types';

export default defineModule({
  id: 'system',
  routes: [
    {
      path: '/system/users',
      component: lazy(() => import('./pages/users')),
      meta: { title: 'system.users.title', auth: true },
    },
    {
      path: '/system/messages',
      component: lazy(() => import('./pages/messages')),
      meta: { title: 'system.messages.title', auth: true },
    },
    {
      path: '/system/notification-management',
      component: lazy(() => import('./pages/notification-management')),
      meta: { title: 'system.notificationManagement.title', auth: true },
    },
    {
      path: '/system/announcement-management',
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
        '该用户名已经被其他管理员账号占用。',
      ),
      causes: [
        trans(
          'system.errors.user.usernameExists.cause.duplicate',
          '新增或编辑管理员时使用了重复用户名',
        ),
        trans('system.errors.user.usernameExists.cause.imported', '导入数据中存在同名账号'),
      ],
      suggestions: [
        trans('system.errors.user.usernameExists.suggestion.rename', '更换用户名'),
        trans(
          'system.errors.user.usernameExists.suggestion.search',
          '在管理员用户列表中搜索该用户名确认是否已存在',
        ),
      ],
      severity: 'warning',
    },
    'SYSTEM.USER.NOT_FOUND': {
      title: trans('system.errors.user.notFound.title', '管理员用户不存在'),
      description: trans(
        'system.errors.user.notFound.description',
        '目标管理员账号不存在，可能已被删除或当前账号无权查看。',
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
