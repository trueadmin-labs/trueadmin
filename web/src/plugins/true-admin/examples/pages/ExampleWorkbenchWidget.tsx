import { Badge, Button, Progress, Space, Tag, Typography } from 'antd';
import type { WorkbenchWidgetRenderContext } from '@/core/module/types';
import './ExampleWorkbenchWidget.css';

type ExampleWorkbenchVariant =
  | 'context'
  | 'actions'
  | 'notice'
  | 'metric'
  | 'shortcuts'
  | 'tasks'
  | 'pipeline'
  | 'calendar'
  | 'recent'
  | 'help'
  | 'bars'
  | 'distribution'
  | 'health'
  | 'activity';

type ExampleWorkbenchData = {
  variant: ExampleWorkbenchVariant;
  value?: string;
  meta?: string;
  trend?: string;
  percent?: number;
  tags?: string[];
  items?: string[];
};

const widgetData: Record<string, ExampleWorkbenchData> = {
  'workbench.headerContext': {
    variant: 'context',
    value: 'TrueAdmin 控制台',
    meta: '开发示例插件 / 华东一区 / 今日运行稳定',
    tags: ['超级管理员', '开发环境'],
  },
  'workbench.headerActions': {
    variant: 'actions',
    items: ['新建任务', '导入数据', '同步配置'],
  },
  'workbench.notice': {
    variant: 'notice',
    items: ['示例插件已注册 17 个工作台组件', '队列延迟低于 30ms', '2 个插件配置待同步'],
  },
  'workbench.metric.pending': {
    variant: 'metric',
    value: '24',
    meta: '待处理',
    trend: '+6',
    percent: 68,
  },
  'workbench.metric.approval': {
    variant: 'metric',
    value: '8',
    meta: '待审批',
    trend: '-2',
    percent: 42,
  },
  'workbench.metric.message': {
    variant: 'metric',
    value: '156',
    meta: '消息触达',
    trend: '+18%',
    percent: 81,
  },
  'workbench.metric.risk': {
    variant: 'metric',
    value: '3',
    meta: '风险提醒',
    trend: '低',
    percent: 24,
  },
  'workbench.shortcuts': {
    variant: 'shortcuts',
    items: ['成员管理', '角色授权', '通知管理', '插件示例'],
  },
  'workbench.priority': {
    variant: 'tasks',
    items: ['复核新成员账号', '确认权限变更申请', '检查备份任务结果', '处理插件安装计划'],
  },
  'workbench.focus': {
    variant: 'pipeline',
    items: ['需求确认', '接口联调', '测试验收', '发布准备'],
  },
  'workbench.asideTop': {
    variant: 'calendar',
    items: ['10:30 例行巡检', '14:00 插件规范评审', '16:30 发布窗口确认'],
  },
  'workbench.asideMiddle': {
    variant: 'recent',
    items: ['成员管理', '加载态示例', '消息中心', '多级菜单'],
  },
  'workbench.asideBottom': {
    variant: 'help',
    items: ['插件 manifest 规范', '工作台 slot 说明'],
  },
  'workbench.insightsLeft': {
    variant: 'bars',
    items: ['访问量', '任务完成率', '消息送达率', '接口成功率'],
  },
  'workbench.insightsRight': {
    variant: 'distribution',
    tags: ['系统 48%', '插件 32%', '用户 20%'],
  },
  'workbench.operations': {
    variant: 'health',
    items: ['认证服务', '数据库连接', '后台队列', '插件扫描'],
  },
  'workbench.activity': {
    variant: 'activity',
    items: ['同步菜单资源', '更新个人偏好', '发送示例通知', '刷新工作台组件'],
  },
};

const fallbackData: ExampleWorkbenchData = {
  variant: 'notice',
  items: ['示例组件未配置数据'],
};

const progressValue = (index: number) => [92, 78, 64, 86][index] ?? 50;

export function ExampleWorkbenchWidget({ widget }: WorkbenchWidgetRenderContext) {
  const data = widgetData[widget.key] ?? fallbackData;

  if (data.variant === 'context') {
    return (
      <div className="trueadmin-example-workbench trueadmin-example-workbench-context">
        <Typography.Text strong>{data.value}</Typography.Text>
        <Typography.Text type="secondary">{data.meta}</Typography.Text>
        <Space size={6} wrap>
          {data.tags?.map((tag) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </Space>
      </div>
    );
  }

  if (data.variant === 'actions') {
    return (
      <div className="trueadmin-example-workbench-action-grid">
        {data.items?.map((item) => (
          <Button key={item} size="small">
            {item}
          </Button>
        ))}
      </div>
    );
  }

  if (data.variant === 'notice') {
    return (
      <div className="trueadmin-example-workbench-notice">
        {data.items?.map((item, index) => (
          <Tag color={['processing', 'success', 'warning'][index] ?? 'default'} key={item}>
            {item}
          </Tag>
        ))}
      </div>
    );
  }

  if (data.variant === 'metric') {
    return (
      <div className="trueadmin-example-workbench trueadmin-example-workbench-metric">
        <div>
          <span className="trueadmin-example-workbench-value">{data.value}</span>
          <Tag color={data.trend?.startsWith('+') ? 'green' : 'default'}>{data.trend}</Tag>
        </div>
        <Typography.Text type="secondary">{data.meta}</Typography.Text>
        <Progress percent={data.percent} size="small" showInfo={false} />
      </div>
    );
  }

  if (data.variant === 'shortcuts') {
    return (
      <div className="trueadmin-example-workbench-shortcuts">
        {data.items?.map((item) => (
          <Button key={item} size="small" type="text">
            {item}
          </Button>
        ))}
      </div>
    );
  }

  if (data.variant === 'pipeline') {
    return (
      <div className="trueadmin-example-workbench-pipeline">
        {data.items?.map((item, index) => (
          <div className="trueadmin-example-workbench-step" key={item}>
            <span>{index + 1}</span>
            <Typography.Text>{item}</Typography.Text>
          </div>
        ))}
      </div>
    );
  }

  if (data.variant === 'bars' || data.variant === 'health') {
    return (
      <div className="trueadmin-example-workbench-list">
        {data.items?.map((item, index) => (
          <div className="trueadmin-example-workbench-bar" key={item}>
            <Typography.Text>{item}</Typography.Text>
            <Progress percent={progressValue(index)} size="small" />
          </div>
        ))}
      </div>
    );
  }

  if (data.variant === 'distribution') {
    return (
      <Space size={8} wrap>
        {data.tags?.map((tag, index) => (
          <Tag color={['geekblue', 'cyan', 'gold'][index] ?? 'default'} key={tag}>
            {tag}
          </Tag>
        ))}
      </Space>
    );
  }

  return (
    <div className="trueadmin-example-workbench-list">
      {data.items?.map((item, index) => (
        <div className="trueadmin-example-workbench-row" key={item}>
          <Badge status={index === 0 ? 'processing' : 'default'} />
          <Typography.Text>{item}</Typography.Text>
        </div>
      ))}
    </div>
  );
}
