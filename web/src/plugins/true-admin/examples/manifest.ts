import { trans } from '@trueadmin/web-core/i18n';
import { Descriptions, Tag } from 'antd';
import { createElement, lazy } from 'react';
import { defineModule } from '@/core/module/types';
import {
  EXAMPLE_PROFILE_PREFERENCE_KEY,
  ExampleProfilePreferencePanel,
} from './pages/ExampleProfilePreferencePanel';

export default defineModule({
  id: 'true-admin.examples',
  routes: [
    {
      path: '/examples/permission',
      component: lazy(() => import('./pages/PermissionExamplePage')),
      meta: { title: 'examples.permission.title', auth: true },
    },
    {
      path: '/examples/loading',
      component: lazy(() => import('./pages/LoadingExamplePage')),
      meta: { title: 'examples.loading.title', auth: true },
    },
    {
      path: '/examples/page-container',
      component: lazy(() => import('./pages/PageContainerExamplePage')),
      meta: { title: 'examples.pageContainer.title', auth: true },
    },
    {
      path: '/examples/crud',
      component: lazy(() => import('./pages/CrudExamplePage')),
      meta: { title: 'examples.crud.title', auth: true },
    },
    {
      path: '/examples/form-controls',
      component: lazy(() => import('./pages/components/FormControlsExamplePage')),
      meta: { title: 'examples.formControls.title', auth: true },
    },
    {
      path: '/examples/attachments',
      component: lazy(() => import('./pages/components/AttachmentExamplePage')),
      meta: { title: 'examples.attachment.title', auth: true },
    },
    {
      path: '/examples/display',
      component: lazy(() => import('./pages/components/DisplayExamplePage')),
      meta: { title: 'examples.display.title', auth: true },
    },
    {
      path: '/examples/markdown',
      component: lazy(() => import('./pages/components/MarkdownExamplePage')),
      meta: { title: 'examples.markdown.title', auth: true },
    },
    {
      path: '/examples/actions',
      component: lazy(() => import('./pages/components/ActionExamplePage')),
      meta: { title: 'examples.actions.title', auth: true },
    },
    {
      path: '/examples/audit',
      component: lazy(() => import('./pages/components/AuditExamplePage')),
      meta: { title: 'examples.audit.title', auth: true },
    },
    {
      path: '/examples/selector',
      component: lazy(() => import('./pages/SelectorExamplePage')),
      meta: { title: 'examples.selector.title', auth: true },
    },
    {
      path: '/examples/stream',
      component: lazy(() => import('./pages/StreamExamplePage')),
      meta: { title: 'examples.stream.title', auth: true },
    },
    {
      path: '/examples/notification',
      component: lazy(() => import('./pages/NotificationExamplePage')),
      meta: { title: 'examples.notification.title', auth: true },
    },
    {
      path: '/examples/complex-form',
      component: lazy(() => import('./pages/ComplexFormExamplePage')),
      meta: {
        title: 'examples.complexForm.title',
        auth: true,
        layout: { showFooter: false },
      },
    },
    {
      path: '/examples/complex-detail',
      component: lazy(() => import('./pages/ComplexDetailExamplePage')),
      meta: {
        title: 'examples.complexDetail.title',
        auth: true,
        layout: { showFooter: false },
      },
    },
    {
      path: '/examples/multilevel/second/third',
      component: lazy(() => import('./pages/MultiLevelMenuPage')),
      meta: { title: 'examples.multilevel.title', auth: true },
    },
  ],
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
  icons: {
    'true-admin.examples.logo': '/mock/icons/true-admin-examples.svg',
  },
  notification: {
    sources: {
      'true-admin.examples': {
        label: trans('examples.name', '开发示例'),
      },
    },
    types: {
      example_task: {
        label: trans('examples.notification.type.task', '示例任务'),
        color: 'cyan',
        icon: 'BellOutlined',
        payloadRender: ({ payload }) =>
          createElement(
            Descriptions,
            { bordered: true, column: 1, size: 'small' },
            Object.entries(payload).map(([key, value]) =>
              createElement(
                Descriptions.Item,
                { key, label: key },
                key === 'status'
                  ? createElement(Tag, { color: 'processing' }, String(value))
                  : String(value),
              ),
            ),
          ),
      },
    },
  },
  profile: {
    preferences: [
      {
        key: EXAMPLE_PROFILE_PREFERENCE_KEY,
        title: trans('examples.profilePreference.title', '开发示例偏好'),
        description: trans(
          'examples.profilePreference.description',
          '演示插件如何向个人中心注册自己的配置面板。',
        ),
        sort: 9000,
        render: ({ value, saving, save }) =>
          createElement(ExampleProfilePreferencePanel, { value, saving, onSave: save }),
      },
    ],
  },
});
