import {
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  List,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Text, Title } = Typography;

const useWorkbenchData = (t: (key?: string, fallback?: string) => string) => ({
  metrics: [
    {
      key: 'pending',
      title: t('workbench.metric.pending', '待处理'),
      value: 6,
      suffix: '',
      icon: <ClockCircleOutlined />,
      trend: t('workbench.metric.trend.new', '+2'),
    },
    {
      key: 'online',
      title: t('workbench.metric.online', '在线用户'),
      value: 128,
      suffix: '',
      icon: <TeamOutlined />,
      trend: t('workbench.metric.trend.online', '+12%'),
    },
    {
      key: 'api',
      title: t('workbench.metric.api', '接口成功率'),
      value: 99.8,
      suffix: '%',
      icon: <ApiOutlined />,
      trend: t('workbench.metric.trend.day', '24 小时'),
    },
    {
      key: 'risk',
      title: t('workbench.metric.risk', '风险提醒'),
      value: 1,
      suffix: '',
      icon: <SafetyCertificateOutlined />,
      trend: t('workbench.metric.trend.low', '低'),
    },
  ],
  todos: [
    {
      title: t('workbench.todo.userAudit', '复核新管理员账号'),
      time: t('workbench.todo.minutesAgo', '18 分钟前').replace('{{count}}', '18'),
      status: 'processing' as const,
    },
    {
      title: t('workbench.todo.permission', '确认权限变更申请'),
      time: t('workbench.todo.minutesAgo', '42 分钟前').replace('{{count}}', '42'),
      status: 'warning' as const,
    },
    {
      title: t('workbench.todo.backup', '检查备份任务结果'),
      time: t('workbench.todo.minutesAgo', '55 分钟前').replace('{{count}}', '55'),
      status: 'default' as const,
    },
  ],
  shortcuts: [
    {
      label: t('workbench.quick.users', '用户管理'),
      path: '/system/users',
      icon: <UserOutlined />,
    },
    {
      label: t('workbench.quick.permission', '权限示例'),
      path: '/examples/permission',
      icon: <SafetyCertificateOutlined />,
    },
    {
      label: t('workbench.quick.loading', '加载态示例'),
      path: '/examples/loading',
      icon: <ClockCircleOutlined />,
    },
  ],
  health: [
    {
      label: t('workbench.health.auth', '认证服务'),
      value: 100,
      icon: <SafetyCertificateOutlined />,
    },
    { label: t('workbench.health.database', '数据库连接'), value: 96, icon: <DatabaseOutlined /> },
    { label: t('workbench.health.queue', '后台队列'), value: 88, icon: <ApiOutlined /> },
  ],
  recent: [
    { label: t('workbench.recent.users', '管理员用户'), path: '/system/users' },
    { label: t('workbench.recent.loading', '加载态展示'), path: '/examples/loading' },
    {
      label: t('workbench.recent.multilevel', '多级菜单'),
      path: '/examples/multilevel/second/third',
    },
  ],
});

export default function WorkbenchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const data = useWorkbenchData(t);

  return (
    <TrueAdminPage className="trueadmin-workbench">
      <Space direction="vertical" size={16} className="trueadmin-workbench-stack">
        <section className="trueadmin-workbench-summary">
          <div>
            <Title level={4}>{t('workbench.greeting', '早上好，超级管理员')}</Title>
            <Text type="secondary">
              {t('workbench.summary', '当前系统运行稳定，今日还有 6 项事务待处理。')}
            </Text>
          </div>
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('workbench.health.normal', '正常')}
          </Tag>
        </section>

        <Row gutter={[16, 16]}>
          {data.metrics.map((metric) => (
            <Col key={metric.key} xs={24} sm={12} lg={6}>
              <Card size="small" className="trueadmin-workbench-metric">
                <div className="trueadmin-workbench-metric-icon">{metric.icon}</div>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                  precision={metric.suffix === '%' ? 1 : 0}
                />
                <Text type="secondary" className="trueadmin-workbench-metric-trend">
                  {metric.trend}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={14}>
            <Card size="small" title={t('workbench.todo.title', '待办事项')}>
              <List
                dataSource={data.todos}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status={item.status} />}
                      title={item.title}
                      description={item.time}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card size="small" title={t('workbench.quick.title', '快捷入口')}>
              <div className="trueadmin-workbench-shortcuts">
                {data.shortcuts.map((shortcut) => (
                  <Button
                    key={shortcut.path}
                    icon={shortcut.icon}
                    onClick={() => navigate(shortcut.path)}
                  >
                    {shortcut.label}
                  </Button>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={14}>
            <Card size="small" title={t('workbench.health.title', '系统状态')}>
              <Space direction="vertical" size={14} className="trueadmin-workbench-health-list">
                {data.health.map((item) => (
                  <div key={item.label} className="trueadmin-workbench-health-item">
                    <Space>
                      {item.icon}
                      <Text>{item.label}</Text>
                    </Space>
                    <Progress percent={item.value} size="small" status="active" />
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card size="small" title={t('workbench.recent.title', '最近访问')}>
              <List
                dataSource={data.recent}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="open" type="link" onClick={() => navigate(item.path)}>
                        {t('workbench.action.open', '打开')}
                      </Button>,
                    ]}
                  >
                    <Text>{item.label}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </TrueAdminPage>
  );
}
