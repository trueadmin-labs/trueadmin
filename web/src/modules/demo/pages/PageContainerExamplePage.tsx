import { ReloadOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Button, List, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useI18n } from '@/core/i18n/I18nProvider';
import { TrueAdminPageSection } from '@/core/page/TrueAdminPageSection';
import { TrueAdminSplitPage } from '@/core/page/TrueAdminSplitPage';

const { Text } = Typography;

type DemoRow = {
  key: string;
  name: string;
  owner: string;
  status: string;
  updatedAt: string;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function PageContainerExamplePage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(1);
  const rows: DemoRow[] = Array.from({ length: version % 2 === 0 ? 8 : 5 }).map((_, index) => ({
    key: String(index + 1),
    name: `${t('demo.pageContainer.table.name', '业务配置')} ${index + 1}`,
    owner:
      index % 2 === 0
        ? t('demo.pageContainer.owner.admin', '系统管理员')
        : t('demo.pageContainer.owner.ops', '运营管理员'),
    status:
      index % 3 === 0
        ? t('demo.pageContainer.status.enabled', '已启用')
        : t('demo.pageContainer.status.pending', '待确认'),
    updatedAt: `2026-05-07 10:${String(20 + index).padStart(2, '0')}`,
  }));
  const columns: TableProps<DemoRow>['columns'] = [
    {
      title: t('demo.pageContainer.column.name', '名称'),
      dataIndex: 'name',
    },
    {
      title: t('demo.pageContainer.column.owner', '负责人'),
      dataIndex: 'owner',
      width: 140,
    },
    {
      title: t('demo.pageContainer.column.status', '状态'),
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Tag
          color={
            status === t('demo.pageContainer.status.enabled', '已启用') ? 'success' : 'processing'
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: t('demo.pageContainer.column.updatedAt', '更新时间'),
      dataIndex: 'updatedAt',
      width: 180,
    },
  ];

  const reload = async () => {
    setLoading(true);
    await wait(800);
    setVersion((currentVersion) => currentVersion + 1);
    setLoading(false);
  };

  return (
    <TrueAdminSplitPage
      showHeader
      title={t('demo.pageContainer.title', '页面容器示例')}
      description={t(
        'demo.pageContainer.description',
        '沉淀页面、区块、加载态和左右分栏的基础组合。',
      )}
      extra={
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
          {t('demo.pageContainer.reload', '刷新')}
        </Button>
      }
      leftTitle={t('demo.pageContainer.left.title', '业务目录')}
      rightTitle={t('demo.pageContainer.right.title', '内容区')}
      leftWidth={260}
      left={
        <List
          size="small"
          dataSource={[
            t('demo.pageContainer.left.item.basic', '基础信息'),
            t('demo.pageContainer.left.item.permission', '权限策略'),
            t('demo.pageContainer.left.item.audit', '审计记录'),
            t('demo.pageContainer.left.item.setting', '扩展配置'),
          ]}
          renderItem={(item, index) => (
            <List.Item className={index === 0 ? 'is-active' : undefined}>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      }
      right={
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <TrueAdminPageSection
            title={t('demo.pageContainer.section.standard.title', '标准区块')}
            description={t(
              'demo.pageContainer.section.standard.description',
              '区块标题、描述和操作区域保持轻量。',
            )}
            extra={
              <Tag color="blue">{t('demo.pageContainer.section.standard.tag', 'Section')}</Tag>
            }
            padding={false}
          >
            <Space size={24} wrap>
              <span>
                <Text type="secondary">{t('demo.pageContainer.metric.total', '总数')}</Text>
                <br />
                <Text strong>{rows.length}</Text>
              </span>
              <span>
                <Text type="secondary">{t('demo.pageContainer.metric.version', '版本')}</Text>
                <br />
                <Text strong>{version}</Text>
              </span>
              <span>
                <Text type="secondary">{t('demo.pageContainer.metric.height', '高度来源')}</Text>
                <br />
                <Text strong>{t('demo.pageContainer.metric.viewport', 'WorkspaceViewport')}</Text>
              </span>
            </Space>
          </TrueAdminPageSection>

          <TrueAdminPageSection
            title={t('demo.pageContainer.section.loading.title', '区块加载')}
            loading={loading}
            loadingTip={t('demo.pageContainer.section.loading.tip', '正在刷新区块')}
            initialLoadingHeight={220}
            padding={false}
          >
            <Table<DemoRow>
              size="small"
              rowKey="key"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 720 }}
            />
          </TrueAdminPageSection>
        </Space>
      }
    />
  );
}
