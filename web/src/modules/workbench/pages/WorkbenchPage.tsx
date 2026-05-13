import { AppstoreOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  List,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTabsStore } from '@/app/layout/tabs/tabsStore';
import { useCurrentUserQuery } from '@/core/auth';
import type { CurrentAdminUser } from '@/core/auth/types';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminIcon } from '@/core/icon/TrueAdminIcon';
import { useMenuTreeQuery } from '@/core/menu/hooks';
import type { BackendMenu } from '@/core/menu/types';
import { TrueAdminPage } from '@/core/page/TrueAdminPage';

const { Text, Title } = Typography;

type Translate = (key?: string, fallback?: string) => string;

type WorkbenchMenuSummary = {
  enabled: number;
  navigable: BackendMenu[];
};

const flattenMenus = (menus: BackendMenu[] = []): BackendMenu[] =>
  menus.flatMap((menu) => [menu, ...flattenMenus(menu.children ?? [])]);

const isEnabledMenu = (menu: BackendMenu) => menu.status !== 'disabled';

const isNavigableMenu = (menu: BackendMenu) =>
  isEnabledMenu(menu) && menu.type !== 'button' && Boolean(menu.path || menu.url);

const resolveMenuTitle = (menu: BackendMenu, t: Translate) =>
  menu.i18n ? t(menu.i18n, menu.title) : menu.title || menu.code || menu.path;

const summarizeMenus = (menus: BackendMenu[] = []): WorkbenchMenuSummary => {
  const enabledMenus = flattenMenus(menus).filter(isEnabledMenu);

  return {
    enabled: enabledMenus.length,
    navigable: enabledMenus.filter(isNavigableMenu),
  };
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 6) {
    return '夜深了';
  }
  if (hour < 12) {
    return '早上好';
  }
  if (hour < 18) {
    return '下午好';
  }

  return '晚上好';
};

const getDisplayName = (user?: CurrentAdminUser) => user?.nickname || user?.username || '管理员';

const getUserRoles = (user?: CurrentAdminUser) =>
  user?.effectiveRoles?.length ? user.effectiveRoles : (user?.roles ?? []);

const getRecordText = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return undefined;
};

const getPositionLabels = (user?: CurrentAdminUser) =>
  (user?.positions ?? []).map(
    (position, index) =>
      getRecordText(position, ['name', 'title', 'positionName', 'code']) ?? `岗位 ${index + 1}`,
  );

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : error ? String(error) : '';

export default function WorkbenchPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: currentUser, error: userError, isLoading: userLoading } = useCurrentUserQuery();
  const { data: menuTree, error: menuError, isLoading: menuLoading } = useMenuTreeQuery();
  const tabs = useTabsStore((state) => state.tabs);

  const menuSummary = useMemo(() => summarizeMenus(menuTree), [menuTree]);
  const quickMenus = useMemo(
    () => menuSummary.navigable.filter((menu) => menu.path !== '/').slice(0, 10),
    [menuSummary.navigable],
  );
  const recentTabs = useMemo(
    () =>
      [...tabs]
        .filter((tab) => !tab.home)
        .sort((left, right) => right.openedAt - left.openedAt)
        .slice(0, 6),
    [tabs],
  );

  const roleList = getUserRoles(currentUser);
  const positionLabels = getPositionLabels(currentUser);
  const loading = userLoading || menuLoading;

  const statusItems = [
    userError
      ? {
          key: 'user-error',
          status: 'error' as const,
          title: '用户信息加载失败',
          description: getErrorMessage(userError),
        }
      : {
          key: 'user',
          status: currentUser ? ('success' as const) : ('processing' as const),
          title: currentUser ? '当前用户已就绪' : '正在加载当前用户',
          description: currentUser ? `账号：${currentUser.username}` : '等待后端返回账号资料',
        },
    menuError
      ? {
          key: 'menu-error',
          status: 'error' as const,
          title: '菜单树加载失败',
          description: getErrorMessage(menuError),
        }
      : {
          key: 'menu',
          status: menuLoading ? ('processing' as const) : ('success' as const),
          title: menuLoading ? '正在加载菜单' : `可访问入口 ${menuSummary.navigable.length} 个`,
          description: menuLoading ? '等待后端返回菜单资源' : `启用资源 ${menuSummary.enabled} 个`,
        },
  ];

  const openMenu = (menu: BackendMenu) => {
    if (menu.path) {
      navigate(menu.path);
      return;
    }

    if (menu.url) {
      window.open(menu.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <TrueAdminPage>
      <Space direction="vertical" size={16}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card>
              <Skeleton active avatar paragraph={{ rows: 2 }} loading={userLoading}>
                <Flex align="center" gap={16} justify="space-between" wrap>
                  <Flex align="center" gap={16} wrap>
                    <Avatar size={72} src={currentUser?.avatar} icon={<UserOutlined />} />
                    <Space direction="vertical" size={4}>
                      <Title level={3}>
                        {getGreeting()}，{getDisplayName(currentUser)}
                      </Title>
                      <Text type="secondary">@{currentUser?.username ?? '-'}</Text>
                      <Space size={[6, 6]} wrap>
                        {roleList.slice(0, 3).map((role) => (
                          <Tag color="blue" key={role}>
                            {role}
                          </Tag>
                        ))}
                        {roleList.length > 3 ? <Tag>+{roleList.length - 3}</Tag> : null}
                      </Space>
                    </Space>
                  </Flex>
                  <Button type="primary" onClick={() => navigate('/profile')}>
                    个人中心
                  </Button>
                </Flex>

                <Descriptions
                  column={{ xs: 1, sm: 2, md: 4 }}
                  items={[
                    {
                      key: 'deptScope',
                      label: '部门范围',
                      children: currentUser?.deptIds?.length ?? 0,
                    },
                    {
                      key: 'positions',
                      label: '岗位',
                      children: positionLabels.length,
                    },
                    {
                      key: 'primaryDept',
                      label: '主部门',
                      children: currentUser?.primaryDeptId ?? '-',
                    },
                    {
                      key: 'operationDept',
                      label: '操作部门',
                      children: currentUser?.operationDeptId ?? '-',
                    },
                  ]}
                  size="small"
                />
              </Skeleton>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="当前状态">
              <List
                dataSource={statusItems}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status={item.status} />}
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Card title="常用访问">
          <Skeleton active loading={loading} paragraph={{ rows: 5 }}>
            <Tabs
              items={[
                {
                  key: 'quick',
                  label: (
                    <Space>
                      <AppstoreOutlined />
                      快捷入口
                    </Space>
                  ),
                  children:
                    quickMenus.length > 0 ? (
                      <List
                        grid={{ gutter: 12, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 5 }}
                        dataSource={quickMenus}
                        renderItem={(menu) => (
                          <List.Item>
                            <Button
                              block
                              icon={<TrueAdminIcon icon={menu.icon} />}
                              onClick={() => openMenu(menu)}
                            >
                              {resolveMenuTitle(menu, t)}
                            </Button>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可访问入口" />
                    ),
                },
                {
                  key: 'recent',
                  label: (
                    <Space>
                      <ClockCircleOutlined />
                      最近打开
                    </Space>
                  ),
                  children:
                    recentTabs.length > 0 ? (
                      <List
                        dataSource={recentTabs}
                        renderItem={(tab) => (
                          <List.Item
                            actions={[
                              <Button key="open" type="link" onClick={() => navigate(tab.path)}>
                                打开
                              </Button>,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={
                                <TrueAdminIcon icon={tab.icon} fallback={<ClockCircleOutlined />} />
                              }
                              title={t(tab.title, tab.title)}
                              description={tab.path}
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无最近打开页面" />
                    ),
                },
              ]}
            />
          </Skeleton>
        </Card>
      </Space>
    </TrueAdminPage>
  );
}
