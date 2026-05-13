import { trans } from '@trueadmin/web-core/i18n';
import { Descriptions, Tag } from 'antd';
import { createElement, lazy } from 'react';
import { defineModule } from '@/core/module/types';
import {
  EXAMPLE_PROFILE_PREFERENCE_KEY,
  ExampleProfilePreferencePanel,
} from './pages/ExampleProfilePreferencePanel';
import { ExampleWorkbenchWidget } from './pages/ExampleWorkbenchWidget';
import './examples.css';

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
  workbench: {
    widgets: [
      {
        key: 'workbench.headerContext',
        slot: 'header.main',
        title: trans('examples.workbench.headerContext.title', '示例上下文'),
        description: trans(
          'examples.workbench.headerContext.description',
          '插件注册的顶部上下文信息。',
        ),
        order: 10,
        size: 'compact',
        overflow: 'hidden',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.headerActions',
        slot: 'header.actions',
        title: trans('examples.workbench.headerActions.title', '示例操作'),
        description: trans('examples.workbench.headerActions.description', '顶部操作区按钮示例。'),
        order: 10,
        size: 'compact',
        overflow: 'hidden',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.notice',
        slot: 'notice',
        title: trans('examples.workbench.notice.title', '示例提醒'),
        description: trans('examples.workbench.notice.description', '全局提醒区内容示例。'),
        order: 10,
        size: 'compact',
        overflow: 'hidden',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.metric.pending',
        slot: 'overview.metrics',
        title: trans('examples.workbench.metric.pending.title', '待处理'),
        description: trans('examples.workbench.metric.description', '指标概览区 span=6。'),
        order: 10,
        span: 6,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.metric.approval',
        slot: 'overview.metrics',
        title: trans('examples.workbench.metric.approval.title', '待审批'),
        description: trans('examples.workbench.metric.description', '指标概览区 span=6。'),
        order: 20,
        span: 6,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.metric.message',
        slot: 'overview.metrics',
        title: trans('examples.workbench.metric.message.title', '消息触达'),
        description: trans('examples.workbench.metric.description', '指标概览区 span=6。'),
        order: 30,
        span: 6,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.metric.risk',
        slot: 'overview.metrics',
        title: trans('examples.workbench.metric.risk.title', '风险提醒'),
        description: trans('examples.workbench.metric.description', '指标概览区 span=6。'),
        order: 40,
        span: 6,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.shortcuts',
        slot: 'overview.shortcuts',
        title: trans('examples.workbench.shortcuts.title', '示例快捷入口'),
        description: trans('examples.workbench.shortcuts.description', '快捷入口区 span=12。'),
        order: 10,
        span: 12,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.priority',
        slot: 'main.priority',
        title: trans('examples.workbench.priority.title', '示例待办'),
        description: trans(
          'examples.workbench.priority.description',
          '主工作区使用 tall 和内部滚动。',
        ),
        order: 10,
        size: 'tall',
        maxHeight: 360,
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.focus',
        slot: 'main.focus',
        title: trans('examples.workbench.focus.title', '示例业务流'),
        description: trans('examples.workbench.focus.description', '主内容区使用受控高度展示。'),
        order: 10,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.asideTop',
        slot: 'aside.top',
        title: trans('examples.workbench.asideTop.title', '示例日程'),
        description: trans('examples.workbench.asideTop.description', '右侧顶部辅助区。'),
        order: 10,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.asideMiddle',
        slot: 'aside.middle',
        title: trans('examples.workbench.asideMiddle.title', '示例最近访问'),
        description: trans('examples.workbench.asideMiddle.description', '右侧中部辅助区。'),
        order: 10,
        size: 'normal',
        maxHeight: 180,
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.asideBottom',
        slot: 'aside.bottom',
        title: trans('examples.workbench.asideBottom.title', '示例帮助'),
        description: trans('examples.workbench.asideBottom.description', '右侧底部辅助区。'),
        order: 10,
        size: 'compact',
        overflow: 'hidden',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.insightsLeft',
        slot: 'insights.left',
        title: trans('examples.workbench.insightsLeft.title', '示例趋势'),
        description: trans('examples.workbench.insightsLeft.description', '数据洞察左区。'),
        order: 10,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.insightsRight',
        slot: 'insights.right',
        title: trans('examples.workbench.insightsRight.title', '示例分布'),
        description: trans('examples.workbench.insightsRight.description', '数据洞察右区。'),
        order: 10,
        size: 'normal',
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.operations',
        slot: 'operations',
        title: trans('examples.workbench.operations.title', '示例运行状态'),
        description: trans('examples.workbench.operations.description', '运行状态区受控高度。'),
        order: 10,
        size: 'normal',
        maxHeight: 240,
        component: ExampleWorkbenchWidget,
      },
      {
        key: 'workbench.activity',
        slot: 'activity',
        title: trans('examples.workbench.activity.title', '示例活动记录'),
        description: trans('examples.workbench.activity.description', '活动记录区内部滚动。'),
        order: 10,
        size: 'normal',
        maxHeight: 260,
        component: ExampleWorkbenchWidget,
      },
    ],
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
